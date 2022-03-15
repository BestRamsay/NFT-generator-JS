import {generateNFT} from '../generator.js'
import {randomUUID } from 'crypto';
import { setTimeout } from 'timers/promises';
import * as mysql_connect from  '../mysql_connect.js'
import {imageFilter, archivingFolder} from '../utilities.js'
import multer from 'multer';
import fs from 'fs';




mysql_connect.createTables()

export const getTraitTypesServer =  async (req, res) => {
    try {
        const getStatus = await mysql_connect.requestData();
        const result = await setTimeout(2000, ''); 
        if (getStatus) {
            res.status(200).json(mysql_connect.getTraitTitles());
        } else {
            res.status(502).json({error: 'Error receiving trait types'});
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Error receiving trait types'});
    }

}

export const getTraitsServer = async(req, res) => {
    try {
        const getStatus = await mysql_connect.requestData();
        const result = await setTimeout(2000, ''); 
        if (getStatus) {
            res.status(200).json(mysql_connect.getProbability());
        } else {
            res.status(502).json({error: 'Error receiving traits'});
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Error receiving traits'});
    }
}

export const getConflictsServer = async (req, res) => {
    try {
        const getStatus = await mysql_connect.requestData();
        const result = await setTimeout(2000, ''); 
        if (getStatus) {
            res.status(200).json(mysql_connect.getConflicts());
        } else {
            res.status(502).json({error: 'Error receiving conflicts'});
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Error receiving conflicts'});
    }
}

export const getUnconditionalMatchServer = async (req,res) => {
    try {
        const getStatus = await mysql_connect.requestData();
        const result = await setTimeout(2000, ''); 
        if (getStatus) {
            res.status(200).json(mysql_connect.getUnconditionalMatches());
        } else {
            res.status(502).json({error: 'Error receiving Unconditional Matches'});
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Error receiving Unconditional Matches'});
    }
}

export const getBundleServer = async (req, res) => {
    console.log(req.body);
    const info = {...req.body};
    await archivingFolder(`./output/${info.bundle}`,info.bundle );
    fs.rename(`${info.bundle}.zip`, `./static/${info.bundle}.zip`, err => {
        if(err) throw err; // не удалось переместить файл
        console.log('Файл успешно перемещён');
     });
    res.status(200).json({'status': 'done'})
}

export const nftGenerate = async (req, res) => {
    try {
        console.log(req.body);
        const info = {...req.body};
        const bundleUUID = randomUUID();
        const generateStatus = await generateNFT(info.amountNFT,  
                {'collection': `${info.collectionName}`, 
                'collection_id': 'nft.contract.near',
                'creator_id': 'contract.near'},
                bundleUUID);
        console.log(generateStatus);
        if (generateStatus) {
            res.status(201).json({"yourBundle":bundleUUID});
        } else {
            res.status(502).json({"yourBundle":bundleUUID});
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({"error":'Can\'t NFT'});
    }
}

export const setTraitTypesServer = async(req, res) => {
    try {
        console.log(req.body);
        const traits = {...req.body}
        const setStatus = mysql_connect.setValues('traittypes', ['title'], [`\'${traits.name}\'`])
        if (setStatus) {
            res.status(201).json(traits);
        } else {
            res.status(502).json(traits);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({'error':'Can\'t create a trait'});
    }
}

export const setTraitsServer = async (req, res) => {
    try {
        console.log(req.body);
        const info = {...req.body};
        if (typeof info.trait !== 'number' || typeof info.probability !== 'number') {
            res.status(400).json(info);
            return;
        }
        const setStatus = await mysql_connect.setValues('traits', ['traittype_id','title', 'probability'], 
        [`${info.trait}`, `\'${info.title}\'`, `${info.probability}`])
        if (setStatus) {
            res.status(201).json(info);
        } else {
            res.status(502).json(info);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({'error': 'Can\'t create a trait'})
    }
}

export const setConflictsServer = async (req, res) => {
    try {
        console.log(req.body);
        const info = {...req.body};
        if (typeof info.trait1 !== 'number' ||  typeof info.trait2 !== 'number' || typeof info.traitSubstitute !== 'number') {
            res.status(400).json(info);
            return;
        }
        const setStatus = await mysql_connect.setValues('conflicts', ['trait_1_id','trait_2_id', 'trait_substitute'],
        [`${info.trait1}`, `${info.trait2}`, `${info.traitSubstitute - 1}`]) 
        // вычитается единица т.к.  счет между конфликами идёт с нулевого
        if (setStatus) {
            res.status(201).json(info);
        } else {
            res.status(502).json(info);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({'error': 'Can\'t create a conflict'})
    }
}

export const setNewUnconditionalMatchServer = async (req, res) => {
    try {
        console.log(req.body);
        const info = {...req.body};
        if (typeof info.trait !== 'number' ||  typeof info.unconditionalMatch !== 'number') {
            res.status(400).json(info);
            return;
        }
        const setStatus = await mysql_connect.setValues('unconditional_matches', ['trait_id','match_trait_id'], [`${info.trait}`, `${info.unconditionalMatch}`]) 
        if (setStatus) {
            res.status(201).json(info);
        } else {
            res.status(502).json(info);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({'error': 'Can\'t create a unconditional match'})
    }
}

export const uploadManyImagesServer = async (req, res) => {
    const newUser = randomUUID();
    var Data = new Date();
    const newTimeLabel = Data.getTime();

    fs.mkdirSync(`./static/uploads/${newUser}_${newTimeLabel}/`, err => {
        if(err) throw err;
        console.log('Все папки успешно созданы');
    });

    // 1000 is the limit I've defined for number of uploaded files at once
    // 'multiple_images' is the name of our file input field
    let upload = multer({ storage: multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, `./static/uploads/${newUser}_${newTimeLabel}`); // поменять пути
        },
        // By default, multer removes file extensions so let's add them back
        filename: function(req, file, cb) { 
            cb(null, file.originalname); // поменять имя
        }
    }),
    fileFilter: imageFilter }).array('multiple_images', 1000);

    upload(req, res, function(err) {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        }
        const path = `./static/uploads/${newUser}_${newTimeLabel}/`;
        const filesArray = fs.readdirSync(path).filter(file => fs.lstatSync(path+file).isFile())
        res.status(201).json({'text':'your image has been uploaded', 'bundle':`${newUser}_${newTimeLabel}`, 'images':filesArray});    // в ответе вернуть newUser + дату
    });
}