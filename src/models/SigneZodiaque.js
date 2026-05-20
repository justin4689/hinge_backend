import mongoose from "mongoose";

const signeZodiaqueSchema = new mongoose.Schema({
  
  name: {
    type: String,   
    required: true,
  },

});

export default mongoose.model("SigneZodiaque", signeZodiaqueSchema);