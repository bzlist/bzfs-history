import bzfquery from "https://raw.githubusercontent.com/The-Noah/bzfquery.js/master/bzfquery.ts";
import {init as mongoInit, MongoClient} from "https://deno.land/x/mongo@v0.8.0/mod.ts";
import "https://deno.land/x/denv/mod.ts";

const serverlist: {
  protocol: string,
  hex: string,
  address: string,
  port: number,
  ip: string,
  title: string,
  owner: string
}[] = (await fetch("https://my.bzflag.org/db/?action=LIST&listformat=json&version=BZFS0221").then(async (res) => JSON.parse((await res.text()).replace(/\\'/g, "'")))).servers.map((server: string[]) => {
  return {
    protocol: server[0],
    hex: server[1],
    address: server[2].split(":")[0],
    port: parseInt(server[2].split(":")[1]) || 5154,
    ip: server[3],
    title: server[4],
    owner: server[5]
  };
});

const client = new MongoClient();
client.connectWithUri(Deno.env.get("DB_URL") || `mongodb+srv://${Deno.env.get("DB_USER")}:${Deno.env.get("DB_PASSWORD")}@${Deno.env.get("DB_HOSTNAME")}/`);

const db = client.database(Deno.env.get("DB_NAME") || "bzfs_history");
const serversCollection = db.collection("servers");

const servers = [];
for(const server of serverlist){
  const query = await bzfquery(server.address, server.port);
  if(!query){
    console.log(`query for ${server.address}:${server.port} is falsy`);
    continue;
  }

  const data = {
    ...server,
    ...query,
    timestamp: Math.floor(new Date().getTime() / 1000)
  };

  servers.push(data);
}

serversCollection.insertMany(servers);
