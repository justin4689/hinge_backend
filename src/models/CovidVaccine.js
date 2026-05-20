import mongoose from "mongoose";

const covidVaccineSchema = new mongoose.Schema({
  name: {
    type: String,   
    required: true,
  },

});

export default mongoose.model("CovidVaccine", covidVaccineSchema);