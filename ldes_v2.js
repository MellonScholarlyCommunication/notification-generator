const fs = require('fs');

exports.generateLDES = function (dir) {
    console.log(`generating ldes for ${dir}...`);

    fs.readdir(dir, (err,files) => {
        if (err) 
            throw err;

        files.forEach( (file) => {
            const stats = fs.statSync(`${dir}/${file}`);
            if (stats.isDirectory() && file.match(/^[A-Za-z0-9]/)) {
                _generateLDES(`${dir}/${file}`);
            }
        });
    });
}

function _generateLDES(dir) {
    const subdir = dir.replace(/.*\//g,'');
    const ldes = {
        "@context" : {
            "ldes" : "https://w3id.org/ldes#",
            "tree" : "https://w3id.org/tree#",
            "ldp" : "http://www.w3.org/ns/ldp#",
            "dc" : "http://purl.org/dc/elements/1.1/",
            "ov" : "http://open.vocab.org/terms/",
            "tree:member": { "@container": "@list"}
         } ,
         "@id": `http://localhost:3000/${subdir}/ldes.jsonld#EventStream`,
         "@type": [ "ldes:EventStream" , "evt:EventLog" ],
         "tree:member": []
    };

    fs.readdir(dir, (err,files) => {
        if (err)
            throw err

        files.forEach( file => {
            if (!file.match(/jsonld$/) || file == 'ldes.jsonld')
                return;
            
            const stats = fs.statSync(`${dir}/${file}`);
            const modified = (new Date(stats.mtime)).toISOString();
            ldes['tree:member'].push({
                "@id": file,
                "@type": [ "ldp:Resource" , "evt:Notification" ],
                "dc:modified": modified
            });
        });

        fs.writeFileSync(`${dir}/ldes.jsonld`,JSON.stringify(ldes,null,2));
    });
}