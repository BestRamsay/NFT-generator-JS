import fs from 'fs';
import fsExtra from 'fs-extra'
import pkg from 'canvas';
const {createCanvas, loadImage} = pkg;
import {requestData, getProbability, getTraitTitles, getConflicts, getUnconditionalMatches, setValues} from './mysql_connect.js';
import { createXLSX, archivingFolder} from './utilities.js';
import { setTimeout } from 'timers/promises';
import { randomUUID } from 'crypto';

import imagemin from 'imagemin';
import imageminPngquant from 'imagemin-pngquant';
const canvas = createCanvas(1920, 1920);
const ctx = canvas.getContext("2d");

const saveLayer =  async (_canvas, _edition, name) => {
	await fs.writeFileSync(`${name}`, _canvas.toBuffer("image/png"));
};

const drawLayer = async (_layer, _edition, name) => {
	try {	
		const image = await loadImage(`${_layer}`);
		//TODO: FIX THIS MAGIC NUM
		ctx.drawImage(
			image,
			0,
			0,
			1920,
			1920
			);
		await saveLayer(canvas, _edition, name);
	} catch (error) {
		console.log(error);
	}
};


class IterableObject extends Object {
    constructor(object) {
        super();
        Object.assign(this, object);
    }
    [Symbol.iterator]() {
        const entries = Object.entries(this);
        let index = 0;

        return {
            next() {
                const result = {
                    value: entries[index],
                    done: index >= entries.length
                };
                index++;

                return result;
            }
        }
    }
}

const weightRandom = (trait, probability) => {
	let data = [];  
	for (let index = 0; index < trait.length; index++) {
		data[index] = [trait[index], probability[index]]
	}
	function shuffle(array) {
		for (let i = array.length - 1; i > 0; i--) {
		  let j = Math.floor(Math.random() * (i + 1));
		  [array[i], array[j]] = [array[j], array[i]];
		}
	}
	shuffle(data);

	let out = [];

	for (let i = 0; i < data.length; ++i) {
		for (let j = 0; j < data[i][1]; ++j) {
			out.push(data[i][0]);
		}
	}
	return out[Math.floor(Math.random() * out.length)];
}

const conflictParse = (image, probabilityTraits, imageNum) => {
	const conficts = getConflicts();

	for (let index = 0; index < conficts.length; index++) {
		const conflictTraits = Object.keys(conficts[index]);
		if (image[`${conflictTraits[0]}`] === conficts[index][`${conflictTraits[0]}`]  && 
			image[`${conflictTraits[1]}`] === conficts[index][`${conflictTraits[1]}`]) {
			
			console.log(`Find conflict! Image: ${imageNum}.png`);
			const regenTrait = conflictTraits[conficts[index][conflictTraits[2]]]
			image[regenTrait] = weightRandom(probabilityTraits[regenTrait][0],
											  probabilityTraits[regenTrait][1]); // title, probability

			const conflict = true;
			return [conflict, image];
		}
		
	}
	const conflict = false;
	return [conflict, image];
}

const unconditionalMatch = (image, imageNum) => {
	const unconditionalMatches = getUnconditionalMatches();

	for (let index = 0; index < unconditionalMatches.length; index++) {
		const match = Object.keys(unconditionalMatches[index]);
		if (image[`${match[0]}`] === unconditionalMatches[index][`${match[0]}`]) {
			console.log(`Find unconditional match! Image: ${imageNum}.png`);
			image[match[1]] = unconditionalMatches[index][match[1]];
			const findUnconditionalMatch = true;
			return [findUnconditionalMatch, image];
		}
		
	}
	const findUnconditionalMatch = false;
	return [findUnconditionalMatch, image];
}

let statAllTraits = {};
const computeStat = (count) => {
	let allJSON = [];
	for (const trait in statAllTraits) {
		for (const title in statAllTraits[trait]) {
			const oneTitle = {"Type": trait,
							  "Value": title,
							  "Count": statAllTraits[trait][title],
							  "Rarity": parseFloat((statAllTraits[trait][title]/count*100).toFixed(2))}
			allJSON.push(oneTitle)
		}
	}
	return JSON.stringify(allJSON, null, 4);
}


const createJSON = async (count, traits, collectionInfo, path) => {
	try{
		let metadataObj =  {"copies" : 1,
						"description" : null,
						"expires_at" : null,
						"extra" : null,
						"issued_at" : null,
						"media" : `${count}.png`,
						"media_hash" : null,
						"reference" : "",
						"reference_hash" : null,
						"starts_at" : null,
						"title" : `${count}`,
						"updated_at" : null,
						"properties" : {} };

		metadataObj.properties.collection = collectionInfo.collection
		metadataObj.properties.collection_id = collectionInfo.collection_id
		metadataObj.properties.creator_id = collectionInfo.creator_id
		metadataObj.properties.attributes = []
		
		for (const trait in traits){
			metadataObj.properties.attributes.push({'trait_type': trait , 'value':traits[trait]})
		}
	
		fs.writeFile(`${path}/${count}.json`, JSON.stringify(metadataObj, null, 4), 'ascii', function(err, result) {
			if(err) console.log('error', err);
		});
	
	} catch (e) {
		console.log(e);
	}
	
} 

const computeRarity = (images, bundle, userID) => { //userID - на будущее. Возможность избежать коллизии. 
	const probabilityTraits = getProbability();

	let imageProbabilities = {};
	for (let index = 0; index < images.length; index++) {
		let probability = 1.0;
		for (const trait of images[index]) {
			const indexTrait = probabilityTraits[trait[0]][0].indexOf(trait[1]);
			probability *= probabilityTraits[trait[0]][1][indexTrait] / 100;
		} 
		imageProbabilities[`${index}`] = probability*100 ;
	}
	let entries = Object.entries(imageProbabilities);
	let sorted = entries.sort((a, b) => a[1] - b[1]);
	createXLSX(sorted, 'rarity', `./output/${bundle}`)
}

export const generateNFT = async (images, collectionInfo, bundle) => {
	const bundleID = randomUUID(); // проверить в DB что нет такого uuid

	try{
		requestData();
		//TODO: проверка на соответствие трейтов и изображений для них!!
		const result = await setTimeout(7000, '');

		fs.mkdirSync(`./output/${bundle}/orig_value/`, { recursive: true }, err => {
			if(err) throw err;
			console.log('Все папки успешно созданы');
		});

		console.log(bundle)
		const traits = getTraitTitles();
		for (const trait of traits) {
			statAllTraits[trait.title] = {};
		}

		const probabilityTraits = getProbability();
		//TODO: добавить проверку на пустоту traits и probabilityTraits	- можно через наличие поля length
		let index = 0;
		let existImagesStrings = [];
		let existImagesObjects = [];
		
		while ( index < images ) {
			console.log(index);
			let newImage = new IterableObject();
			//random choise traits
			for (let index = 0; index < traits.length; index++) {
				newImage[`${traits[index].title}`] = weightRandom(probabilityTraits[`${traits[index].title}`][0],
																		probabilityTraits[`${traits[index].title}`][1]); // title, probability
			}
		
			//conflict check
			let num_regeneration = 0;
			let conflict = true;
			while(conflict){ 
				const resultConflictParse = conflictParse(newImage, probabilityTraits, index)
				conflict = resultConflictParse[0];
				newImage = resultConflictParse[1];
				num_regeneration += 1;
				if (num_regeneration < 5){
				} // 5 times regenerated
				else{
					break;
				}
			}

			//unconditional match check
			if (num_regeneration >= 5){  // badly generated version
				const resultUnconditionalMatch = unconditionalMatch(newImage, index) // тоже должен возврать 2 элемента
				const match = resultUnconditionalMatch[0]; //boolean
				newImage = resultUnconditionalMatch[1]; 
					if (match){  // fix generate
					const resultConflictParse = conflictParse(newImage, probabilityTraits, index);
					conflict = resultConflictParse[0];
					newImage = resultConflictParse[1];
					if (conflict){
						console.log(`abort NFT. Image:${index+1}.png`);
						continue
					} else {
						console.log(`Fix successful. Image:${index}.png`)
					}
				}
				else{
					console.log(`abort NFT. Image:${index}.png`);
					continue
				}
			}
			//prepare data
			const newImageString = (Image) => {
				let allTrait = '';
				for(const trait of Image) {
					allTrait = allTrait + `${trait[0]}:${trait[1]} `
				}
				return allTrait;
			}
			if (existImagesStrings.includes(newImageString(newImage))) {
				console.log(`Image exists: ${index}.png`); 
				continue;
			} else{
				existImagesStrings.push(newImageString(newImage));
				existImagesObjects.push(newImage);
			}


			let allTraits = [];
			for (const key of newImage){
				if (key[1] !== 'None') {
					allTraits.push(`./traits/${key[0]}/${key[1]}.png`);
				}
			}
			//draw image
			await allTraits.forEach(async(trait) =>{
				await drawLayer(trait, index, `./output/${bundle}/orig_value/${index}.png`)
			}) 
			//compress image
			const files = await imagemin([`output/${bundle}/orig_value/${index}.png`], {
				destination: `output/${bundle}/`,
				plugins: [
					imageminPngquant()
				]
			});
			index += 1;
			//prepare stats
			for (const trait of newImage) {
				if (isNaN(statAllTraits[trait[0]][trait[1]])) {
					statAllTraits[trait[0]][trait[1]] = 1;
				} else {
					statAllTraits[trait[0]][trait[1]] += 1; 
				}
			}
		}
		await setValues('bundles', ['id', 'path', 'stats', 'status_id'], [`\'${bundleID}\'` , `\'output/${bundle}\'`, `'${computeStat(images)}'`, '\'success\'']);
		const result_1 = await setTimeout(5000, '');


		for (let index = 0; index < existImagesObjects.length; index++) {
			const newImage = existImagesObjects[index];
			await createJSON(index, newImage, collectionInfo, `./output/${bundle}`);
		}

		fsExtra.remove(`./output/${bundle}/orig_value`, err => {
			console.error(err)
		})

		computeRarity(existImagesObjects, bundle);

		console.log(`Bundle done: ${bundle}`);
		return true
	} catch (e) {
		console.log(e);
		setValues('bundles', ['id', 'path', 'stats', 'status_id'], [`\'${bundleID}\'` , `\'output/${bundle}\'`, `'${computeStat(images)}'`, '\'failed\'']);
		return false
	}
} 


