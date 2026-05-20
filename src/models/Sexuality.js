import mongoose from "mongoose";

const sexualitySchema = new mongoose.Schema({

  name: {
    type: String,   
    required: true,
  },

});

export default mongoose.model("Sexuality", sexualitySchema);