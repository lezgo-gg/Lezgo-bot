import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Build the LFG.gg embed + button for the #lfg channel.
 * @param {string} token - Server access token
 * @returns {{ embeds: EmbedBuilder[], components: ActionRowBuilder[] }}
 */
export function buildLfgEmbed(token) {
  const baseUrl = process.env.LFG_BASE_URL || 'https://lfg.gg';

  const embed = new EmbedBuilder()
    .setColor(0xC89B3C) // gold
    .setTitle('LFG.gg — Trouve ton groupe')
    .setDescription(
      '**Trouve des joueurs LoL en 4 etapes :**\n\n' +
      '1. Clique sur **Rejoindre LFG.gg** ci-dessous\n' +
      '2. Connecte-toi avec Discord\n' +
      '3. Complete ton profil (rank, roles, horaires)\n' +
      '4. Poste une annonce LFG dans cette communaute !\n\n' +
      '*Ton rank est verifie automatiquement via l\'API Riot.*'
    )
    .setFooter({ text: 'LFG.gg — Gratuit · Open · Francophone' });

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Rejoindre LFG.gg')
      .setStyle(ButtonStyle.Link)
      .setURL(`${baseUrl}/?t=${token}`)
  );

  return { embeds: [embed], components: [button] };
}
