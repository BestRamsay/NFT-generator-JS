import XLSX from 'xlsx';
import fs from 'fs';

import archiver from 'archiver';


export const createXLSX = (AoA, name, path) => {
    let wb = XLSX.utils.book_new();

    let ws_data = AoA;
    let ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    XLSX.utils.book_append_sheet(wb, ws, `${name}`);
    
    /* generate an XLSX file */
    XLSX.writeFile(wb, `${name}.xlsx`);

    fs.rename(`${name}.xlsx`, `${path}/${name}.xlsx`, err => {
        if(err) throw err; // не удалось переместить файл
    });
}

export const archivingFolder = async (path, name) => { 
    let output = fs.createWriteStream(`${name}.zip`);
    let archive = archiver('zip');

    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });

    archive.on('error', function(err){
        throw err;
    });
    
    archive.pipe(output);

    archive.directory(path, false);

    archive.directory('subdir/', 'new-subdir');

    await archive.finalize();
}

export const imageFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
