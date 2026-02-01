import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, Collection } from 'discord.js';
import supabase from './lib/supabase.js';
import * as setupCommand from './commands/setup.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Register commands in a collection
client.commands = new Collection();
client.commands.set(setupCommand.data.name, setupCommand);

// --- Register slash commands on startup ---
async function registerCommands() {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const commands = [setupCommand.data.toJSON()];

  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    console.log('Slash commands registered.');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
}

// --- Handle interactions ---
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error executing ${interaction.commandName}:`, err);
    const reply = { content: 'Erreur interne.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// --- Bot removed from a guild → purge access ---
client.on('guildDelete', async (guild) => {
  console.log(`Bot removed from guild ${guild.id} (${guild.name})`);
  try {
    const { data: server } = await supabase
      .from('servers')
      .select('id')
      .eq('guild_id', guild.id)
      .single();

    if (!server) return;

    // Nullify access_token → existing embed links stop working
    await supabase
      .from('servers')
      .update({ access_token: null })
      .eq('id', server.id);

    // Remove all members → immediate loss of access
    await supabase
      .from('server_members')
      .delete()
      .eq('server_id', server.id);

    console.log(`Purged access for guild ${guild.id}`);
  } catch (err) {
    console.error('guildDelete cleanup error:', err);
  }
});

// --- Ready ---
client.once('ready', () => {
  console.log(`LFG Bot connected as ${client.user.tag}`);
  console.log(`Serving ${client.guilds.cache.size} guild(s)`);
});

// --- Start ---
await registerCommands();
await client.login(process.env.DISCORD_TOKEN);
