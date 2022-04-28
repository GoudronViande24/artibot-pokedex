import { SlashCommandBuilder } from "@discordjs/builders";
import Artibot, { Module, SlashCommand } from "artibot";
import Localizer from "artibot-localizer";
import path from "path";
import mainFunction from "./pokedex.js";
import { fileURLToPath } from "url";
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const { version } = require('./package.json');

/**
 * Pokedex slash command extension for Artibot
 * @author GoudronViande24
 * @param {Artibot} artibot
 * @returns {Module}
 */
export default ({ config: { lang } }) => {
	localizer.setLocale(lang);

	return new Module({
		id: "pokedex",
		name: "Pokedex",
		version,
		langs: ["en", "fr"],
		parts: [
			new SlashCommand({
				id: "pokedex",
				data: new SlashCommandBuilder()
					.setName("pokedex")
					.setDescription(localizer._("Get infos on a Pokémon."))
					.addStringOption(option =>
						option
							.setName("id")
							.setDescription(localizer._("The ID (or English name) of the Pokémon to search."))
							.setRequired(true)
					),
				mainFunction
			})
		]
	});
}

export const localizer = new Localizer({
	filePath: path.join(__dirname, "locales.json")
});