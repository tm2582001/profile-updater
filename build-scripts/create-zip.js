import AdmZip from 'adm-zip';

// Create a new zip
const zip = new AdmZip();

// Add a folder
zip.addLocalFolder("build");

zip.deleteFile("config.json");
zip.deleteFile("build.zip");


// Save it
zip.writeZip("build/build.zip");

console.log("Created vendor.zip");