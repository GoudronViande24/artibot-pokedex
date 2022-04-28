/**
 * Pokedex for Discord
 * Uses pokeapi
 * @author GoudronViande24
 */

import { CommandInteraction } from "discord.js";
import axios from "axios";
import { localizer } from "./index.js";
import Artibot from "artibot";

const icon = "https://cdn.pixabay.com/photo/2019/11/27/14/06/pokemon-4657023_960_720.png";
const apiBase = "https://pokeapi.co/api/v2";

/**
 * Get lenght in feets and inches
 * @param {number} n Length in centimeters
 * @returns {string} Feets and inches (example: 5'8")
 */

function toFeet(n) {
	var realFeet = ((n * 0.393700) / 12);
	var feet = Math.floor(realFeet);
	var inches = Math.round((realFeet - feet) * 12);
	return `${feet}'${inches}"`;
};

/**
 * Remove line breaks from a string
 * @param {string} str String to remove line breaks
 * @returns {string} Same string without line breaks
 */

function removeLineBreaks(str) {
	// There is also an invisible character in there (U+000c)
	return str.replace(/(\r\n|\n|\r|)/gm, " ");
};

/**
 * Main command for the pokedex
 * @param {CommandInteraction} interaction 
 * @param {Artibot} artibot 
 */
export default async function execute(interaction, { config, createEmbed }) {
	// Send "Loading" embed
	let waitEmbed = createEmbed()
		.setColor("#e3350d")
		.setTitle("Pokédex")
		.setImage(icon)
		.setDescription(localizer._("Searching..."));

	const message = await interaction.reply({
		embeds: [waitEmbed],
		fetchReply: true
	});

	const input = interaction.options.getString("id").toLowerCase();

	try {
		var response = await axios.get(apiBase + "/pokemon-species/" + input);
		var response2 = await axios.get(apiBase + "/pokemon/" + input);
	} catch (error) {
		if (error.response.status == 404) {
			var content = localizer.__("**Error:**\nCannot find the Pokémon with ID or name `[[0]]`.", { placeholders: [input] });
		} else {
			var content = localizer._("An error occured.");
		}

		let errorEmbed = createEmbed()
			.setColor("#e3350d")
			.setTitle("Pokédex")
			.setDescription(content);

		await message.edit({
			embeds: [errorEmbed]
		});

		return
	}

	const data = response.data;
	const data2 = response2.data;

	let types = [];
	data2.types.forEach(i => types.push(i.type.name));
	types = types.join("\n");

	let forms = [];
	data2.forms.forEach(form => forms.push(form.name));
	forms = forms.join("\n");

	let abilities = [];
	data2.abilities.forEach(i => abilities.push(i.ability.name));
	abilities = abilities.join("\n");

	let special = [];
	if (data.is_legendary)
		special.push(localizer._("Legendary Pokémon"));
	if (data.is_mythical)
		special.push(localizer._("Mythic Pokémon"));
	special = special.join("\n");

	const flavorText = removeLineBreaks(data.flavor_text_entries.find(i => i.language.name == config.lang.toLowerCase()).flavor_text);
	const name = data.names.find(i => i.language.name == config.lang.toLowerCase()).name;
	const id = data.id;
	const generation = data.generation.name.split("-")[1].toUpperCase();
	const category = data.genera.find(i => i.language.name == config.lang.toLowerCase()).genus;
	const image = data2.sprites.other["official-artwork"].front_default;
	const height = `${data2.height * 10} cm\n${toFeet(data2.height * 10)}`;
	const weight = `${data2.weight / 10} kg\n${Math.round(data2.weight / 10 * 2.205 * 10) / 10} lb`;

	let embed = createEmbed()
		.setColor("#e3350d")
		.setTitle("Pokédex")
		.setDescription(`**${name}** - #${id}\n${category}\n${flavorText}`)
		.setImage(image)
		.addField(localizer._("Type(s)"), types, true)
		.addField(localizer._("Height"), height, true)
		.addField(localizer._("Weight"), weight, true)
		.addField(localizer._("Generation"), generation, true)
		.addField(localizer._("Forms"), forms, true)
		.addField(localizer._("Abilities"), abilities, true);

	if (special) {
		embed.addField(localizer._("Special attribute"), special, true);
	};

	if (data.evolves_from_species) {
		const response3 = await axios.get(data.evolves_from_species.url);
		const data3 = response3.data;
		const evolvesFromName = data3.names.find(i => i.language.name == config.lang).name;
		embed.addField(localizer._("Evolves from"), evolvesFromName, true);
	};

	await message.edit({
		embeds: [embed]
	});
}
