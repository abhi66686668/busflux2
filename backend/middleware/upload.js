
const multer =
  require("multer");

const path =
  require("path");



// ================= STORAGE =================

const storage =
  multer.diskStorage({

    destination:
      function(req, file, cb){

        // PROFILE PHOTO
        if(

          file.fieldname ===
          "userPhoto"

        ){

          cb(

            null,

            "uploads/profiles"

          );

        }

        // ID CARD PHOTO
        else {

          cb(

            null,

            "uploads/idcards"

          );

        }

      },



    filename:
      function(req, file, cb){

        cb(

          null,

          Date.now() +

          path.extname(
            file.originalname
          )

        );

      }

});



// ================= FILE FILTER =================

const fileFilter =
  (req, file, cb) => {

    const allowedTypes =

      /jpeg|jpg|png/;



    // CHECK EXTENSION
    const extname =
      allowedTypes.test(

        path.extname(
          file.originalname
        ).toLowerCase()

      );



    // CHECK MIME TYPE
    const mimetype =
      allowedTypes.test(
        file.mimetype
      );



    // VALIDATION
    if(

      extname &&
      mimetype

    ){

      return cb(
        null,
        true
      );

    }



    // INVALID FILE
    cb(

      new Error(

        "Only JPG, JPEG, PNG images allowed"

      )

    );

};



// ================= MULTER =================

const upload =
  multer({

    storage,

    fileFilter

});



module.exports =
  upload;

