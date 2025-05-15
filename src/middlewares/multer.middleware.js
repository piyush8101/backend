import multer from "multer";

//npm multer diskStorage wala code liya h yha pe and thode changes kiye h
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')    //public folder me temp file me apni files ko rkhenge
    },
    filename: function (req, file, cb) {      //req se json return krega or file se file return krega multer file uploading k liye use krte h
     /* const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)    //uniqueSuffix ka use krke hm ek unique suffix lga skte h filename k nend me dash(-) lgake but avi ni kr rhe
      cb(null, file.fieldname + '-' + uniqueSuffix) */

      cb(null, file.originalname)   //avi original filename rkh rhe
    }  
  })
  
  export const upload = multer({ storage,})