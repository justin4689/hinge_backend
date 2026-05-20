import mongoose from "mongoose";

const childrenSchema = new mongoose.Schema({

  name: {
    type: String,   
    required: true,
  },

});

export default mongoose.model("Children", childrenSchema);