console.log(import.meta.env);

const SERVER_IP = import.meta.env.VITE_SERVER_IP ?? "http://172.28.71.175/";
const VEHICLES_ENDPOINT = "api/vehicles/";
const BASE_URL = SERVER_IP + VEHICLES_ENDPOINT;

export const vehicleService = {
  registerCart(name: string) {
    const data = {
      port: 9090,
      name: name,
    };

    console.log("Registering...");
    fetch(BASE_URL + "register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },
};
