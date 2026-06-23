/* eslint-disable @typescript-eslint/no-explicit-any */
console.log(import.meta.env);

/* http://10.247.225.41:8000/ is the fallback*/
function withTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

const DEFAULT_SERVER_IP = withTrailingSlash(
  import.meta.env.VITE_DASHBOARD_API_ROOT ?? "http://10.247.225.41:8000/"
);

const CART_NAME =
  import.meta.env.VITE_CART_NAME ?? "james";

const VEHICLES_ENDPOINT = "api/vehicles/";

export const vehicleService = {
  SERVER_IP: DEFAULT_SERVER_IP,
  BASE_URL: DEFAULT_SERVER_IP + VEHICLES_ENDPOINT,
  ZEROTIER_IP: import.meta.env.VITE_ZEROTIER_IP,

  setServerIP(address: string) {
    console.log(address);
    this.SERVER_IP = address ?? DEFAULT_SERVER_IP;
    this.BASE_URL = this.SERVER_IP + VEHICLES_ENDPOINT;
  },

  registerCart(name: string) {
    const data: any = {
      name: name,
    };

    if (this.ZEROTIER_IP) {
      data.url = `ws://${this.ZEROTIER_IP}:9090`;
    } else {
      data.port = 9090;
    }

    console.log("Registering...");
    fetch(this.BASE_URL + "register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  },

  async requestHelp(
    name: string,
    helpRequested?: boolean
  ): Promise<{ helpRequested: boolean }> {
    const res = await fetch(this.BASE_URL + name + "/toggle-help", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        helpRequested: helpRequested,
      }),
    });

    return res.json();
  },

  async updateTrip(
    name: string,
    data: {
      startLocation?: string;
      endLocation?: string;
      tripProgress?: number;
    }
  ) {
    const url = `${this.BASE_URL}${encodeURIComponent(name)}/`;
    console.log("[Dashboard Debug] import.meta.env:", import.meta.env);
    console.log("[Dashboard Debug] SERVER_IP:", this.SERVER_IP);
    console.log("[Dashboard Debug] BASE_URL:", this.BASE_URL);
    console.log("[Dashboard Debug] cart name:", name);
    console.log("[Dashboard Debug] update URL:", url);
    console.log("[Dashboard Debug] update data:", data);
    console.log("[Dashboard] Updating trip:", url, data);
  
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  
    if (!res.ok) {
      throw new Error(`Dashboard trip update failed: ${res.status} ${res.statusText}`);
    }
  
    return res.json();
  }
};
