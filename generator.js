import fs from 'fs';
import mergeImages from 'merge-images';
import pkg from 'canvas';

const {Canvas, Image , createCanvas, loadImage} = pkg;

import ImageDataURI from 'image-data-uri';
import {requestData, getProbability, getTraitTitles, getConflicts, getUnconditionalMatches, setValues} from './mysql_connect.js';
import { setTimeout } from 'timers/promises';
import { randomUUID } from 'crypto';

const canvas = createCanvas(400, 400);
const ctx = canvas.getContext("2d");

const saveLayer =  async (_canvas, _edition, name) => {
	await fs.writeFileSync(`${name}`, _canvas.toBuffer("image/png"));
};

const drawLayer = async (_layer, _edition, name) => {

	const image = await loadImage(`${_layer}`);
	console.log(`image: ${_layer}` );
	console.log(`_edition: ${_edition}`);
	//TODO: FIX THIS MAGIC NUM
	ctx.drawImage(
		image,
		0,
		0,
		400,
		400
		);
	await saveLayer(canvas, _edition, name);
	
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
			
			console.log(`Find conflict! Image: ${imageNum+1}.png`);
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
			console.log(`Find unconditional match! Image: ${imageNum+1}.png`);
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


const createJSON = async(name, count, traits, royaltyRecepient, collectionInfo, path) => {
	//console.log(name, count, traits, royaltyRecepient, collectionInfo, path );
	try{
		let metadataObj =  {"copies" : 1,
						"description" : "lorem ipusm",
						"expires_at" : null,
						"extra" : null,
						"issued_at" : null,
						"media" : "",
						"media_hash" : null,
						"reference" : "",
						"reference_hash" : null,
						"starts_at" : null,
						"title" : `${name} #${count}`,
						"updated_at" : null,
						"royalties" : [],
						"properties" : {} };
		
		for(const recepient of royaltyRecepient){
			metadataObj.royalties.push(recepient)
		}
	
		metadataObj.properties.collection = collectionInfo.collection
		metadataObj.properties.collection_id = collectionInfo.collection_id
		metadataObj.properties.creator_id = collectionInfo.creator_id
		metadataObj.properties.attributes = []
		
		for (const trait in traits){
			metadataObj.properties.attributes.push({'trait_type': trait , 'value':traits[trait]})
		}
	
		fs.writeFileSync(`${path}/${count}.json`, JSON.stringify(metadataObj, null, 4), 'ascii', function(err, result) {
			if(err) console.log('error', err);
			console.log(result);
		});


	
	} catch (e) {
		console.log(e);
	}
	
} 

export const getTraits = async (images, royaltyRecepient, collectionInfo, bundle) => {
	const bundleID = randomUUID();

	try{
		requestData();
		const result = await setTimeout(7000, '');
		//setValues('bundles', ['id', 'path', 'stats', 'status_id'], [`\'${bundleID}\'` , `\'output/${bundle}\'`, `'${JSON.stringify([])}'`, '\'pending\'']);

		fs.mkdir(`./output/${bundle}`, err => {
			if(err) throw err; // не удалось создать папку
		 });

		console.log(bundle)
		const traits = getTraitTitles();
		for (const trait of traits) {
			statAllTraits[trait.title] = {};
		}

		const probabilityTraits = getProbability();
		//TODO: добавить проверку на пустоту traits и probabilityTraits		- можно через наличие поля length
		let index = 0;
		let existImagesStrings = [];
		let existImagesObjects = [];
		
		while ( index < images ) {
			console.log(index);
			let newImage = new IterableObject();

			for (let index = 0; index < traits.length; index++) {
				newImage[`${traits[index]['title']}`] = weightRandom(probabilityTraits[`${traits[index]['title']}`][0],
																		probabilityTraits[`${traits[index]['title']}`][1]); // title, probability
			}
		

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
						console.log(`Fix successful. Image:${index+1}.png`)
					}
				}
				else{
					console.log(`abort NFT. Image:${index+1}.png`);
					continue
				}
			}

			const newImageString = () => {
				let allTrait = '';
				for(const trait of newImage) {
					allTrait = allTrait + `${trait[0]}:${trait[1]} `
				}
				return allTrait;
			}
			if (existImagesStrings.includes(newImageString())) {
				console.log(`Image exists: ${index}.png`); 
				continue;
			} else{
				existImagesStrings.push(newImageString());
				existImagesObjects.push(newImage);
			}


			let allTraits = [];

			for (const key of newImage){	 //TODO если значение none - не вообще не добавлять слой
				if (key[1] !== 'None') {
					allTraits.push(`./traits/${key[0]}/${key[1]}.png`);
				}
			}


			// const b64 = await mergeImages([    '0.png',
			// './traits/T-shirt/Poker t-shirt.png'], { Canvas: Canvas, Image: Image });
			// await ImageDataURI.outputFile(b64, `./output/${bundle}/${index}.png`);

			// await mergeImages([  '0.png',
			// './traits/T-shirt/Poker t-shirt.png'])
  			// 	.then(b64 => document.querySelector('img').src = b64);

			console.log(allTraits);
			await allTraits.forEach(async(trait) =>{
				await drawLayer(trait, index, `./output/${bundle}/${index}.png`)
			}) 

			index += 1;

			for (const trait of newImage) {
				if (isNaN(statAllTraits[trait[0]][trait[1]])) {
					statAllTraits[trait[0]][trait[1]] = 1;
				} else {
					statAllTraits[trait[0]][trait[1]] += 1; 
				}
			}
		}
		await setValues('bundles', ['id', 'path', 'stats', 'status_id'], [`\'${bundleID}\'` , `\'output/${bundle}\'`, `'${computeStat(images)}'`, '\'success\'']);
		const result_1 = await setTimeout(3000, '');

		console.log(computeStat(images));

		//console.log(computeStat(images)) TODO: пререрабоать в вывод статы
		for (let index = 0; index < existImagesObjects.length; index++) {
			const newImage = existImagesObjects[index];
			createJSON('new', index, newImage, royaltyRecepient, collectionInfo, `./output/${bundle}`);
		}

		return true
	} catch (e) {
		console.log(e);
		setValues('bundles', ['id', 'path', 'stats', 'status_id'], [`\'${bundleID}\'` , `\'output/${bundle}\'`, `'${computeStat(images)}'`, '\'failed\'']);
		return false
	}
} 


