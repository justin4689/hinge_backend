import mongoose from "mongoose";

const ethnicitySchema = new mongoose.Schema({

  name: {
    type: String,
    nullable: true,
  },
});

export default mongoose.model("Ethnicity", ethnicitySchema);    