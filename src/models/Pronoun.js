import mongoose from "mongoose";

const pronounSchema = new mongoose.Schema({

  name: {
    type: String,   
    required: true,
  },

});

export default mongoose.model("Pronoun", pronounSchema);