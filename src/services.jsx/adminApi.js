import {toast}  from "react-toastify";
import { urls } from "./urls";
import {axiosClient} from "./apiClient";
import { data } from "react-router-dom";

export async function loginApi(formData) {
    try{
        let {data}=await axiosClient.post(urls.login , formData);
        if(data.status){
            toast.success(data.message || "login successfull");
            return data.data;
        }else {
            toast.error(data.message || "login failed");
            return false;
        }
    }catch(error)
    {
        toast.error(error.response?.data?.message || error.message);
        
    }return false;
}

// export async function registerApi(formData) {
//     try{
//         let {data}=await axiosClient.post(urls.register,formData);
//         if(data.status){
//             toast.success(data.message || "register successfull");
//             return data.data;
//         }else{
//             toast.error(data.message || "register failed");
//             return false;
//         }
//     }catch (error) {
//   throw error;
// }
// }

export async function registerApi(formData) {
  try {
    const { data } = await axiosClient.post(urls.register, formData);

    if (data.status) {
      toast.success(data.message || "Registration successful!");
      return data.data;
    }

    toast.error(data.message || "Registration failed!");
    return false;
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Registration failed. Please try again."
    );

    return false;
  }
}

export async function adminDashboard(formData) {
    try{
        const {data}=await axiosClient.get(urls.AdminDashboardBoard,formData);

        if(data.status){
            toast.success(data.message || "admin Data fetched successully");
            return data.data;
        }
        toast.error(data.message || "fetched failed");
        return false;
        
    }catch(error){
        toast.error(
            error.response?.data?.message || "fetched failed. please try adgain."
        );
        return null;
    }
}

export async function lessonApi(formData) {
    try{
        const {data}=await axiosClient.get(urls.lesson,formData);

        if(data.status){
            toast.success(data.message || "lesson data fetched");
            return data.data;
        }
        toast.error(data.messagec || "lesson fetched failed");
        return false;
    }
}