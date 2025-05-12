console.log(import.meta.env);

// const DEFAULT_SERVER_IP =
//   import.meta.env.VITE_SERVER_IP ?? "http://10.147.17.17:8002/";
const DEFAULT_SERVER_IP = "http://10.147.17.17:8002/";
const VEHICLES_ENDPOINT = "api/vehicles/";

export const vehicleService = {
  // SERVER_IP: import.meta.env.VITE_SERVER_IP ?? "http://10.147.17.17:8002/",
  SERVER_IP: "http://10.147.17.17:8002/",
  BASE_URL: DEFAULT_SERVER_IP + VEHICLES_ENDPOINT,

  setServerIP(address: string) {
    console.log(address);
    this.SERVER_IP = address ?? DEFAULT_SERVER_IP;
    this.BASE_URL = this.SERVER_IP + VEHICLES_ENDPOINT;
  },

  registerCart(name: string) {
    const data = {
      port: 9090,
      name: name,
    };

    console.log("Registering...");
    fetch(this.BASE_URL + "register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },
};
