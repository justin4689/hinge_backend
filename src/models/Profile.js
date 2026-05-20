import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
    gender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gender",
      required: true,
    },
   
 
    sexuality_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sexuality",
      required: true,
    },
   
    children_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Children",
      required: true,
    },
    signe_zodiaque_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SigneZodiaque",
      required: true,
    },

  
     family_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyPlan",
      required: true,
    },
      covid_vaccine_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CovidVaccine",
      required: true,
    },

      
  dob: {
    type: Date,
    required: true,
  },
  height_cm: {
    type: Number,
    required: true,
  },
   neighbourhood: {
    type: String,
    required: true,
  },
    latitude: {
    type: String,
    required: true,
  },
 longitude: {
    type: String,
    required: true,
  },

  max_distance_km : {
    type : number
    nullable:false
  } ,
  min_age  : {
    type : Number ,
    nullable : true
  } ,

  max_age :  {
    type : Number , 
     nullable : true 
  }

  phone : {
    type : Number ,
    nullable :true
  }
 
});

export default mongoose.model("Profile", profileSchema);