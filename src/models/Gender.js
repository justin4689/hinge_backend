import mongoose from "mongoose";

const genderSchema = new mongoose.Schema({

  name: {
    type: String,   
    required: true,
  },
   plural_name: {
    type: String,   
    required: true,
  },

});

export default mongoose.model("Gender", genderSchema);