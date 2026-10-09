const multer=require("multer");
const path=require("path");
const fs=require("fs");
const crypto=require("crypto");
const uploadDirectory=path.join(__dirname,"../uploads");

if(!fs.existsSync(uploadDirectory)){
  fs.mkdirSync(uploadDirectory,{recursive: true});
}

const storage=multer.diskStorage({
  destination: (req,file,cb)=>{
    cb(null,uploadDirectory);
  },
  filename: (req,file,cb)=>{
    const extension=path.extname(file.originalname).toLowerCase();
    const uniqueName=`${crypto.randomUUID()}${extension}`;
    cb(null,uniqueName);
  },
});

const fileFilter=(req,file,cb)=>{
  const allowedTypes=["image/jpeg","image/png","image/webp"];
  if(allowedTypes.includes(file.mimetype)){
    return cb(null,true);
  }
  cb(new Error("Only JPG, PNG, and WebP images are allowed."));
};

const upload=multer({
  storage,
  fileFilter,
  limits:{
    fileSize: 5*1024*1024,
    files: 1,
  },
});

module.exports=upload;