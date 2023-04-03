/**
 * Pokedex for Discord
 * Uses pokeapi
 * @author GoudronViande24
 */

import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import axios, { AxiosError, AxiosResponse } from "axios";
import { localizer } from "./index.js";
import Artibot from "artibot";

const ICON = "https://cdn.pixabay.com/photo/2019/11/27/14/06/pokemon-4657023_960_720.png";
const API_BASE = "https://pokeapi.co/api/v2";

/**
 * Get lenght in feets and inches
 * @param n Length in centimeters
 * @returns Feets and inches (example: 5'8")
 */
function toFeet(n: number): string {
	var realFeet = ((n * 0.393700) / 12);
	var feet = Math.floor(realFeet);
	var inches = Math.round((realFeet - feet) * 12);
	return `${feet}'${inches}"`;
}

/**
 * Remove line breaks from a string
 * @param str String to remove line breaks
 * @returns Same string without line breaks
 */
function removeLineBreaks(str: string): string {
	// There is also an invisible character in there (U+000c)
	return str.replace(/(\r\n|\n|\r|)/gm, " ");
}

/**
 * Main command for the pokedex
 * @param interaction
 * @param artibot
 */
export default async function execute(interaction: ChatInputCommandInteraction<"cached">, { config, createEmbed }: Artibot): Promise<void> {
	// Send "Loading" embed
	const waitEmbed: EmbedBuilder = createEmbed()
		.setColor("#e3350d")
		.setTitle("Pokédex")
		.setImage(ICON)
		.setDescription(localizer._("Searching..."));

	const message: Message<true> = await interaction.reply({
		embeds: [waitEmbed],
		fetchReply: true
	});

	const input: string = interaction.options.getString("id", true).toLowerCase();

	let response: AxiosResponse<any, any>, response2: AxiosResponse<any, any>;
	let content: string;

	try {
		response = await axios.get(API_BASE + "/pokemon-species/" + input);
		response2 = await axios.get(API_BASE + "/pokemon/" + input);
	} catch (error) {
		if (axios.isAxiosError(error) && (error as AxiosError).response && (error as AxiosError).response!.status == 404) {
			content = localizer.__("**Error:**\nCannot find the Pokémon with ID or name `[[0]]`.", { placeholders: [input] });
		} else {
			content = localizer._("An error occured.");
		}

		const errorEmbed: EmbedBuilder = createEmbed()
			.setColor("#e3350d")
			.setTitle("Pokédex")
			.setDescription(content);

		await message.edit({
			embeds: [errorEmbed]
		});

		return;
	}

	const data: {
		is_legendary: boolean;
		is_mythical: boolean;
		flavor_text_entries: {
			flavor_text: string;
			language: {
				name: string;
			};
		}[];
		names: {
			name: string;
			language: {
				name: string;
			};
		}[];
		id: number | string;
		generation: {
			name: string;
		};
		genera: {
			genus: string;
			language: {
				name: string;
			};
		}[];
		evolves_from_species: {
			name: string;
			url: string;
		};
	} = response.data;

	const data2: {
		types: {
			type: {
				name: string;
			};
		}[];
		forms: {
			name: string;
		}[];
		abilities: {
			ability: {
				name: string;
			};
		}[];
		sprites: {
			other: {
				"official-artwork": {
					front_default: string;
				};
			};
		};
		height: number;
		weight: number;
	} = response2.data;

	const types: string = data2.types.map(i => i.type.name).join("\n");
	const forms: string = data2.forms.map(i => i.name).join("\n");
	const abilities: string = data2.abilities.map(i => i.ability.name).join("\n");

	const specials: string[] = [];
	if (data.is_legendary)
		specials.push(localizer._("Legendary Pokémon"));
	if (data.is_mythical)
		specials.push(localizer._("Mythic Pokémon"));
	const special: string = specials.join("\n");

	const flavorTextAvailable: boolean = data.flavor_text_entries.some(i => i.language.name == config.lang.toLowerCase());
	const flavorText: string = removeLineBreaks(data.flavor_text_entries.find(i => i.language.name == (flavorTextAvailable ? config.lang.toLowerCase() : "en"))!.flavor_text);
	const nameAvailable: boolean = data.names.some(i => i.language.name == config.lang.toLowerCase());
	const name: string = data.names.find(i => i.language.name == (nameAvailable ? config.lang.toLowerCase() : "en"))!.name;
	const id: string = data.id.toString();
	const generation: string = data.generation.name.split("-")[1].toUpperCase();
	const categoryAvailable: boolean = data.genera.some(i => i.language.name == config.lang.toLowerCase());
	const category: string = data.genera.find(i => i.language.name == (categoryAvailable ? config.lang.toLowerCase() : "en"))!.genus;
	const image: string = data2.sprites.other["official-artwork"].front_default;
	const height: string = `${data2.height * 10} cm\n${toFeet(data2.height * 10)}`;
	const weight: string = `${data2.weight / 10} kg\n${Math.round(data2.weight / 10 * 2.205 * 10) / 10} lb`;

	const embed: EmbedBuilder = createEmbed()
		.setColor("#e3350d")
		.setTitle("Pokédex")
		.setDescription(`**${name}** - #${id}\n${category}\n${flavorText}`)
		.setImage(image)
		.addFields(
			{ name: localizer._("Type(s)"), value: types, inline: true },
			{ name: localizer._("Height"), value: height, inline: true },
			{ name: localizer._("Weight"), value: weight, inline: true },
			{ name: localizer._("Generation"), value: generation, inline: true },
			{ name: localizer._("Forms"), value: forms, inline: true },
			{ name: localizer._("Abilities"), value: abilities, inline: true }
		);

	if (special) embed.addFields({ name: localizer._("Special attribute"), value: special, inline: true });

	if (data.evolves_from_species) {
		const response3 = await axios.get(data.evolves_from_species.url);
		const data3: {
			names: {
				name: string;
				language: {
					name: string;
				};
			}[];
		} = response3.data;
		const evolvesFromNameAvailable: boolean = data3.names.some(i => i.language.name.toLowerCase() == config.lang.toLowerCase());
		const evolvesFromName: string = data3.names.find(i => i.language.name.toLowerCase() == (evolvesFromNameAvailable ? config.lang.toLowerCase() : "en"))!.name;
		embed.addFields({ name: localizer._("Evolves from"), value: evolvesFromName, inline: true });
	}

	await message.edit({
		embeds: [embed]
	});
}