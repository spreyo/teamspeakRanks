var express = require('express');
var app = express();
const fs = require('fs/promises')
const cors = require('cors');
const bodyParser = require('body-parser');
const e = require('express');
const fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));


const { TeamSpeak, QueryProtocol, TeamSpeakChannel } = require('ts3-nodejs-library');
const { channel } = require('diagnostics_channel');
const mariadb = require('mariadb');
const pool = mariadb.createPool({ host: "sql1.revivenode.com", user: "u22477_HqoGSeGYhI", password: "xPW=GHEs6DEDN9f8!peFTIP9" })
const teamspeak = new TeamSpeak({
    host: "ts3.spreyo.xyz",
    protocol: QueryProtocol.RAW,
    serverport: 9987,
    username: "serveradmin",
    password: "spreyo1523",
    nickname: "group manager"
})


app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());





app.get('/', (req, res, next) => {
    res.status(200);
    res.send(('private api made by spreyo'));
})

app.post("/connectionTime", async (req, res, next) => {
    const conn = await pool.getConnection()
    const users = await teamspeak.clientList()
    let leaderboard = [];
    let done = false;
    users.forEach(async user => {
        if (user.type == 1) {
            return
        }
        console.log(user.nickname)
        const exists = await conn.query(`SELECT name, \`time\`
        FROM s22477_ranks.ranks
        WHERE name = "${user.uniqueIdentifier}";`)
        if (exists.length > 0) {
            let time = await conn.query(`SELECT time
            FROM s22477_ranks.ranks
            WHERE name='${user.uniqueIdentifier}'`)
            time = time[0]["time"]



            await conn.query(`UPDATE s22477_ranks.ranks
            SET time = ${time + 1}
            WHERE name = '${user.uniqueIdentifier}'`)
            time += 1;
            let hours = Math.floor(time / 60);
            let sgid = 0;
            let groups = [15, 16, 17, 18, 19];
            switch (hours) {
                case 1:
                    sgid = 15;
                    break
                case 5:
                    sgid = 16;
                    break
                case 10:
                    sgid = 17;
                    break
                case 20:
                    sgid = 18;
                    break
                case 50:
                    sgid = 19;
                    break

            }

            leaderboard.push({ username: user.nickname, minutes: time });
            leaderboard = leaderboard.sort((a, b) => {
                return b.minutes - a.minutes
            });
            console.log(leaderboard);

            let message = ``;
            leaderboard.forEach((user) => {
                let hours = Math.floor(user.minutes / 60);
                message += `\n ${user.username} : ${Number.isInteger(user.minutes / 60) ? hours : `${hours == 0 ? "" : `${hours}h`} ${user.minutes - hours * 60}m`}`
            })
            fs.writeFile("leaderboard.txt", message, err => { if (err) { console.log(err) } });

            if (!user.servergroups.includes(sgid.toString())) {
                groups.forEach(async group => {
                    try {

                        await user.delGroups(group);
                    } catch (e) {
                    }
                })
                await user.addGroups(sgid);

                done = true;
            }





        } else {
            await conn.query(`INSERT INTO s22477_ranks.ranks
            (name, time)
            VALUES('${user.uniqueIdentifier}', 1);`)
            done = true;
        }
    })
    if (done) {
        await conn.destroy();

    }

    res.send(200);

})

app.get("/leaderboard", async (req, res, next) => {
    let leaderboard = await fs.readFile("leaderboard.txt", "utf8")
    console.log(leaderboard)
    res.send(200, leaderboard);
})

app.listen(3001, () => {
    console.log('server running');
})