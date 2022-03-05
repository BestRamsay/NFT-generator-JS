import {getTraits} from '../generator.js'
import {randomUUID } from 'crypto';
import { setTimeout } from 'timers/promises';

import {getTraitTitles, requestData, getProbability, createTables, setValues} from '../mysql_connect.js'

// getTraits(30,  
// 		 [{'account': '.near', 'amount': '1'},{'account':'account.near', 'amount':'99'}],
// 		  {"collection": "1", "collection_id": "1.near","creator_id": "1"},
// 		  randomUUID());

createTables()

export const getTraitsServer =  async (req, res) => {
    await requestData();
    const result = await setTimeout(4000, '');

    res.status(200).json(getTraitTitles());
}

export const getTitleServer = async(req, res) => {
    await requestData();
    const result = await setTimeout(4000, '');

    res.status(200).json(getProbability());
}

export const setTraitServer = async(req, res) => {
    console.log(req.body);
    const traits = {...req.body}
    setValues('traittypes_1', ['title'], [`\'${traits.name}\'`])
    res.status(201).json(traits);
}

export const nftGenerate = async (req, res) => {
    try {
        console.log(req.body);
        const info = {...req.body}
        const bundleUUID = randomUUID();
        const generateStatus = await getTraits(3000,  
                [{'account': '.near', 'amount': '1'},{'account':'account.near', 'amount':'99'}],
                {'collection': `${info.collectionName}`, 'collection_id': '1.near','creator_id': "1"},
                bundleUUID);
        if (generateStatus) {
            res.status(201).json({"yourBundle":bundleUUID});
        } else {
            res.status(500).json({"yourBundle":bundleUUID});
        }
    
    } catch (e)
    {
        console.log(e);
    }

}