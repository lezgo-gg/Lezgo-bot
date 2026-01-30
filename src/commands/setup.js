import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import supabase from '../lib/supabase.js';
import { buildLfgEmbed } from '../lib/embed.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configure LFG.gg sur ce serveur (cree #lfg et poste l\'embed)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) {
    return interaction.editReply('Cette commande doit etre utilisee dans un serveur.');
  }

  try {
    // 1. Find or create #lfg channel
    let lfgChannel = guild.channels.cache.find(
      ch => ch.name === 'lfg' && ch.type === ChannelType.GuildText
    );

    if (!lfgChannel) {
      lfgChannel = await guild.channels.create({
        name: 'lfg',
        type: ChannelType.GuildText,
        topic: 'Trouve ton groupe sur LFG.gg',
      });
    }

    // 2. Post the embed
    const embedData = buildLfgEmbed(guild.id);
    await lfgChannel.send(embedData);

    // 3. Upsert server in database
    const iconHash = guild.icon;
    const { error } = await supabase
      .from('servers')
      .upsert(
        {
          guild_id: guild.id,
          guild_name: guild.name,
          guild_icon: iconHash || null,
          owner_discord_id: guild.ownerId,
          duoq_channel_id: lfgChannel.id,
        },
        { onConflict: 'guild_id' }
      );

    if (error) {
      console.error('Supabase upsert error:', error);
      return interaction.editReply('Erreur lors de l\'enregistrement du serveur en base.');
    }

    // 4. Confirm
    await interaction.editReply(
      `LFG.gg configure ! L'embed a ete poste dans <#${lfgChannel.id}>.\n` +
      `Les membres peuvent maintenant cliquer pour rejoindre la communaute.`
    );
  } catch (err) {
    console.error('Setup error:', err);
    await interaction.editReply('Une erreur est survenue lors du setup. Verifiez les permissions du bot.');
  }
}
