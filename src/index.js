require("dotenv").config();
const rl = require('readline-specific');
let scoreboard = require('./scores/scoreboard.json');
//let explanations = require("./scores/explanations");
const fs = require("fs");
const { Client, IntentsBitField, ActivityType } = require("discord.js");
const { getLatestVideo, getNthVideo, getVideoCount, getCommentsByUser } = require('../youtubeApi');

const nReadlines = require('n-readlines');

const fgcps = require("./scores/9drooms.json");

const silly = ["mrrrp :3", "meow :3", ":3", ":3 :3", "psspspsppsps :3", ":cat:"]
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const CHANNEL_ID = "UCp7ZXAVupbsyh4V5_XXCubg";

const nined = "./9d"


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});


client.on("ready", (c) => {
    console.log(`✅ ${c.user.tag} is now online. ✅`);
    client.user.setActivity({
        name:"smots gaming",
        type:ActivityType.Watching,
    });
    
});


client.on("interactionCreate", async (interaction) => { 
    
    if (!interaction.isChatInputCommand()) return;


    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const members = await guild.members.fetch();

    if (interaction.commandName == "smots"){ smots(interaction); return; }
    if (interaction.commandName == "daily-smots"){ dailysmots(interaction); return; }
    if (interaction.commandName == "random-smots"){ randomsmots(interaction); return; }
    if (interaction.commandName == "comment"){ comment(interaction); return; }



    // EPIC: The musical, the Explanation Saga. Releases January 32nd
    if (interaction.commandName == "explain"){ explain(interaction); return; }
    if (interaction.commandName == "submit"){ submit(interaction); return; }

    if (interaction.commandName == "progress"){ progress(interaction); return; }
    if (interaction.commandName == "remaining"){ remaining(interaction); return; }
    
    
    
    if (interaction.commandName == "lock"){ lock(interaction); return; }
    if (interaction.commandName == "appoint"){ appoint(interaction); return; }

    if (interaction.commandName == "whatdoido"){ whatdoido(interaction, true); return; }
    if (interaction.commandName == "curate"){ whatdoido(interaction, false); return; }

    if (interaction.commandName == "smonsole"){ smonsole(interaction, members); return; }

    if (interaction.commandName == "list"){ 
        interaction.user.send({files:["./src/scores/explanations.json"]});
        interaction.reply({content:"mrrrp :3", ephemeral:true});
        return;
    }
    
    // EPIC: The musical, the 9DP Saga. Releases July 16th
    if (interaction.commandName == "9dg-new-game"){ newgame(interaction); return;}
    if (interaction.commandName == "9dg-guess"){ 
        fs.readFile("./src/scores/9dg.json", function (err, data) {
            let games = JSON.parse(data);
            if (games.users[interaction.user.id]?.code == undefined) guess(interaction); 
            else guessmult(interaction, games.users[interaction.user.id].code);
            return;
        });
    }
    if (interaction.commandName == "9dg-end-game"){ endgame(interaction); return;}
    if (interaction.commandName == "9dg-join"){ join(interaction); return;}
    if (interaction.commandName == "9dg-start"){ start(interaction); return;}

    
        
    
});

function start(interaction){
    fs.readFile("./src/scores/9dg.json", async function (err, data) {
        let games = JSON.parse(data);
        if (games.users[interaction.user.id] == undefined){interaction.reply({content:"You aren't in a game!", ephemeral:true}); return;}
        if (games.users[interaction.user.id].code == undefined){interaction.reply({content:"You aren't in a game!", ephemeral:true}); return;}
        if (!games.mult[games.users[interaction.user.id].code].players[interaction.user.id].host){interaction.reply({content:"You aren't the host of this game!", ephemeral:true}); return;}
        const code = games.users[interaction.user.id].code;
        games.mult[games.users[interaction.user.id].code].started = true;

        fs.writeFileSync("./src/scores/9dg.json",JSON.stringify(games, null, 2));

        for (let user in games.mult[code].players){
            games.mult[code].players[user].done = false;
            let found = false;
            const guild = client.guilds.cache.get("1326330601908994112");
            const founduser = (await guild.members.fetch()).get(user);
            if (founduser!==undefined) {
                founduser.send({content:`Round has started <@${user}>!\nRound:${games.mult[code].round}/${games.mult[code].rounds}`,files:[games.mult[code].rooms[games.mult[code].round-1]["path"]]});
            }
            
        }
        fs.writeFileSync("./src/scores/9dg.json",JSON.stringify(games, null, 2));
        

    });
}


function join(interaction){
    const code = interaction.options.get("code").value.toUpperCase();
    fs.readFile("./src/scores/9dg.json", async function (err, data) {
        let games = JSON.parse(data);
        if (!games.mult[code]){interaction.reply({content:"That game doesn't exist!",ephemeral:true}); return;}
        if (games.users[interaction.user.id]) {interaction.reply({content:"You are already in a game!",ephemeral:true}); return;}
        if (games.mult[code].started) {interaction.reply({content:"That game has already started!",ephemeral:true}); return;}
        const guild = client.guilds.cache.get("1326330601908994112");
        const founduser = (await guild.members.fetch()).get(interaction.user.id);
        if (founduser==undefined) {interaction.reply({content:"You are not in the smots gaming server, [please join it here](<https://discord.gg/GTXxnNRqej>).",ephemeral:true}); return;}
        games.mult[code].players[interaction.user.id] = {
            "points":0,
            "host":false,
            "done":false,
            "username":interaction.user.username
        };
        games.users[interaction.user.id] = {"code":code};
        fs.writeFileSync("./src/scores/9dg.json",JSON.stringify(games, null, 2));
        interaction.reply({content:`Joined game \`${code}\`!`,ephemeral:true});
    });
}

function endgame(interaction){
    fs.readFile("./src/scores/9dg.json", function (err, data) {
        let games = JSON.parse(data);

        if (games.users[interaction.user.id] == undefined){interaction.reply({content:"You don't have a game running!",ephemeral:true});return;}
        if (games.users[interaction.user.id].code) {
            games.mult[games.users[interaction.user.id].code].players[interaction.user.id] = undefined;
            console.log(Object.keys(games.mult[games.users[interaction.user.id].code].players).length)
            if (Object.keys(games.mult[games.users[interaction.user.id].code].players).length == 1) {
                games.mult[games.users[interaction.user.id].code] = undefined;
            }
            games.users[interaction.user.id] = undefined;
        } else {
            games.single[interaction.user.id] = undefined;
            games.users[interaction.user.id] = undefined;
        }
        fs.writeFileSync("./src/scores/9dg.json",JSON.stringify(games, null, 2));
        interaction.reply({content:"Game ended!",ephemeral:true});
    });
}

function newgame(interaction){
    let rounds = interaction.options.get("rounds").value;
    if (interaction.options.get("multiplayer").value){newgamemult(interaction); return;}
    fs.readFile("./src/scores/9dg.json", function (err, data) {
        let games = JSON.parse(data);
        if (games.users[interaction.user.id] != undefined){interaction.reply({content:"You already have a game running!",ephemeral:true});return;}

        let roomslist = [];
        let smollist = [];

        let secret = interaction.options.get("code");
        if (!secret) secret = ""; else secret = secret.value;
        console.log(secret);

        for (let i = 0; i < rounds; i++){
            let checkpoints = fs.readdirSync(nined);
            let checkpoint = checkpoints[Math.floor(Math.random() * checkpoints.length)];
            let rooms = fs.readdirSync(nined+"/"+checkpoint);
            let room = rooms[Math.floor(Math.random() * rooms.length)];
            let pics = fs.readdirSync(nined+"/"+checkpoint+"/"+room);
            let pic = pics[Math.floor(Math.random() * pics.length)];
    

            if (i == rounds-1 && secret == process.env.SECRET) {
                checkpoint = "SMOTS";
                room = "8";
                pic = "image.png";

                roomslist = roomslist.concat({
                    "checkpoint":checkpoint,
                    "room":room,
                    "path":`${nined}/${checkpoint}/${room}/${pic}`
                });
                break;
            }

            if (pic == "cat.png" && getRandomInt(1,1000) != 1) pic = "image.png"

            if (smollist.includes(`${checkpoint}${room}`) || (secret == process.env.SECRET && checkpoint == "SMOTS" && room == "8")){
                i--;
            } else{
                roomslist = roomslist.concat({
                    "checkpoint":checkpoint,
                    "room":room,
                    "path":`${nined}/${checkpoint}/${room}/${pic}`
                });
                smollist = smollist.concat(`${checkpoint}${room}`);
            }
        }

        games.single[interaction.user.id] = {
            "rounds":rounds,
            "round":1,
            "rooms":roomslist,
            "points":0,
            "user":{
                "username":interaction.user.username,
                "globalname":interaction.user.globalName,
                "id":interaction.user.id
            }
        };
        games.users[interaction.user.id] = {};
        
        fs.writeFileSync("./src/scores/9dg.json",JSON.stringify(games, null, 2));
        interaction.reply({content:`Game has started <@${interaction.user.id}>!\nRound:1/${rounds}`,files:[games.single[interaction.user.id]["rooms"][0]["path"]]});
    });
}


function newgamemult(interaction){
    let rounds = interaction.options.get("rounds").value;
    fs.readFile("./src/scores/9dg.json", async function (err, data) {
        let games = JSON.parse(data);
        if (games.users[interaction.user.id] != undefined){interaction.reply({content:"You already have a game running!",ephemeral:true});return;}
        const guild = client.guilds.cache.get("1326330601908994112");
        const founduser = (await guild.members.fetch()).get(interaction.user.id);
        if (founduser==undefined) {interaction.reply({content:"You are not in the smots gaming server, [please join it here](<https://discord.gg/GTXxnNRqej>).",ephemeral:true}); return;}

        let roomslist = [];
        let smollist = [];

        for (let i = 0; i < rounds; i++){
            let checkpoints = fs.readdirSync(nined);
            let checkpoint = checkpoints[Math.floor(Math.random() * checkpoints.length)];
            let rooms = fs.readdirSync(nined+"/"+checkpoint);
            let room = rooms[Math.floor(Math.random() * rooms.length)];
            let pics = fs.readdirSync(nined+"/"+checkpoint+"/"+room);
            let pic = pics[Math.floor(Math.random() * pics.length)];
    
            if (pic == "cat.png" && getRandomInt(1,1000) != 1) pic = "image.png"

            if (smollist.includes(`${checkpoint}${room}`)){
                i--;
            } else{
                roomslist = roomslist.concat({
                    "checkpoint":checkpoint,
                    "room":room,
                    "path":`${nined}/${checkpoint}/${room}/${pic}`
                });
                smollist = smollist.concat(`${checkpoint}${room}`);
            }
        }
        const randomchar = ()=>{
            return characters[Math.floor(Math.random() * characters.length)];
        }
        let code = randomchar() + randomchar() + randomchar() + randomchar() + randomchar();
        while (games.mult[code]){
            code = randomchar() + randomchar() + randomchar() + randomchar() + randomchar();
        }

        games.mult[code] = {
            "started":false,
            "rounds":rounds,
            "round":1,
            "rooms":roomslist,
            "players":{}
        };
        games.mult[code].players[interaction.user.id] = {
            "points":0,
            "host":true,
            "done":false,
            "username":interaction.user.username
        }
        games.users[interaction.user.id] = {"code":code};
        
        fs.writeFileSync("./src/scores/9dg.json",JSON.stringify(games, null, 2));
        interaction.reply({content:`Game created!\nThe code is:\n\`${code}\``,ephemeral:true})
    });
}


function guessmult(interaction, code){
    fs.readFile("./src/scores/9dg.json", function (err, data) {
        let games = JSON.parse(data);
        
        if (!games.mult[code].started){interaction.reply({content:"The game hasn't started yet!",ephemeral:true});return;}
        if (games.mult[code].players[interaction.user.id].done){interaction.reply({content:"You have already guessed on this round!",ephemeral:true});return;}
        let checkpoint = interaction.options.get("checkpoint").value;
        let roomnum = interaction.options.get("room").value;
        let currentround = games.mult[code].round-1;
        let cpa = games.mult[code].rooms[currentround].checkpoint;
        let rna = games.mult[code].rooms[currentround].room;
        let points = 0;

        let lowerlimit = ()=>{
            let total = 0;
            for (let i = 0; i < fgcps.length; i++){
                if (fgcps[i].cp == cpa) {
                    total += parseInt(rna);
                    break;
                }
                total += fgcps[i].rooms;
            }
            return total;
        };
        let roomdist = ()=>{
            let lower = false;
            let total = 0;
            for (let i = 0; i < fgcps.length; i++){
                if (fgcps[i].cp == cpa) {
                    if(!(checkpoint == cpa && roomnum < parseInt(rna))) lower = true;
                    
                }
                if (fgcps[i].cp == checkpoint) {
                    total += roomnum;
                    break;
                }
                total += fgcps[i].rooms;
            }
            if (lower){
                return total-lowerlimit();
            } else {
                return lowerlimit()-total;
            }
        };
        points = Math.ceil(5000 / (1 + (roomdist() * 0.05)));
        
        games.mult[code].players[interaction.user.id].points += points;
        games.mult[code].players[interaction.user.id].done = true;



        fs.writeFileSync("./src/scores/9dg.json",JSON.stringify(games, null, 2));
        
        interaction.reply({content:"Guess submitted!", ephemeral:true});
    });
}

setInterval(()=>{
    fs.readFile("./src/scores/9dg.json", async function (err, data) {
        let games = JSON.parse(data);
        for (let game in games.mult) {
            let total = 0;
            for (let user in games.mult[game].players){
                if (games.mult[game].players[user].done) total++;
            }
            if (total == Object.keys(games.mult[game].players).length){
                games.mult[game].round++;
                let gameover = false;
                for (let user in games.mult[game].players){
                    games.mult[game].players[user].done = false;
                    const guild = client.guilds.cache.get("1326330601908994112");
                    const founduser = (await guild.members.fetch()).get(user);
                    if (founduser!==undefined) {
                        if (games.mult[game].round-1 == games.mult[game].rounds){
                            let leaderboard = []
                            for (let player in games.mult[game].players){
                                leaderboard = leaderboard.concat({
                                    "points":games.mult[game].players[player].points,
                                    "username":games.mult[game].players[player].username
                                });
                            }
                            let leaderboardtext = "";
                            for (let i = 0; i < leaderboard.length; i++){
                                leaderboardtext = leaderboardtext.concat(`\n${i+1}. ${leaderboard[i].username}          ${leaderboard[i].points}`);
                            }
                            console.log(leaderboard);
                            leaderboard.sort((a, b) => b.points - a.points);
                            founduser.send(`Game Over!\nYou scored ${games.mult[game].players[user].points}/${games.mult[game].rounds*5000}\`\`\`${leaderboardtext}\`\`\``);
                            games.users[user] = undefined;
                            gameover = true;
                        } else {
                            founduser.send({content:`Round has started <@${user}>!\nRound:${games.mult[game].round}/${games.mult[game].rounds}`,files:[games.mult[game].rooms[games.mult[game].round-1]["path"]]});
                        }
                    }
                    
                }
                if(gameover){
                    games.mult[game] = undefined;
                }
                fs.writeFileSync("./src/scores/9dg.json",JSON.stringify(games, null, 2));
            }
        }
    });
},5000)


function guess(interaction){
    fs.readFile("./src/scores/9dg.json", function (err, data) {
        let games = JSON.parse(data);
        if (games.users[interaction.user.id] == undefined){interaction.reply({content:"You don't have a game running!",ephemeral:true});return;}
        let checkpoint = interaction.options.get("checkpoint").value;
        let roomnum = interaction.options.get("room").value;
        let currentround = games.single[interaction.user.id].round-1;
        let cpa = games.single[interaction.user.id].rooms[currentround].checkpoint;
        let rna = games.single[interaction.user.id].rooms[currentround].room;
        let points = 0;

        let lowerlimit = ()=>{
            let total = 0;
            for (let i = 0; i < fgcps.length; i++){
                if (fgcps[i].cp == cpa) {
                    total += parseInt(rna);
                    break;
                }
                total += fgcps[i].rooms;
            }
            return total;
        };
        let roomdist = ()=>{
            let lower = false;
            let total = 0;
            for (let i = 0; i < fgcps.length; i++){
                if (fgcps[i].cp == cpa) {
                    if(!(checkpoint == cpa && roomnum < parseInt(rna))) lower = true;
                    
                }
                if (fgcps[i].cp == checkpoint) {
                    total += roomnum;
                    break;
                }
                total += fgcps[i].rooms;
            }
            if (lower){
                return total-lowerlimit();
            } else {
                return lowerlimit()-total;
            }
        };
        points = Math.ceil(5000 / (1 + (roomdist() * 0.05)));
        
        games.single[interaction.user.id].points += points;


        if (games.single[interaction.user.id].round == games.single[interaction.user.id].rounds) {
            interaction.reply(`You guessed **${checkpoint}-${roomnum}**\nThe room was **${cpa}-${rna}**. You scored **${points}** points!\nGame Over!\nYou scored **${games.single[interaction.user.id].points}**/${games.single[interaction.user.id].rounds*5000}.`);
            games.single[interaction.user.id] = undefined;
            games.users[interaction.user.id] = undefined;
            fs.writeFileSync("./src/scores/9dg.json",JSON.stringify(games, null, 2));
            return;
        }

        games.single[interaction.user.id].round++;
        fs.writeFileSync("./src/scores/9dg.json",JSON.stringify(games, null, 2));
        
        interaction.reply({content:`You guessed **${checkpoint}-${roomnum}**\nThe room was **${cpa}-${rna}**. You scored **${points}** points!\nRound has started <@${interaction.user.id}>!\nRound:${currentround+2}/${games.single[interaction.user.id].rounds}`,files:[games.single[interaction.user.id]["rooms"][currentround+1]["path"]]});
    });
}


function smonsole(interaction,members){

    let name = interaction.options.get("command").value;
    let arg = interaction.options.get("argument")?.value;
    if (name[0] == "$") name = name.slice(1);
    fs.readFile("./src/scores/smonsole.json", function (err, data) {
        let commands = JSON.parse(data);

        if (!(name in commands)){interaction.reply({content:`The command\n\`$ ${name}\`\ndoesn't exist.`,ephemeral:true}); return;}

        let f = new Function(commands[name].arguments, commands[name].body);
        f(interaction,arg,members);
        //interaction.reply({content:":3",ephemeral:true});

    });
}



function whatdoido(interaction, idk){
    let message = "wow looks like this idiot doesn't know how to code";
    fs.readFile("./src/scores/explanations.json", function (err, data) {
        let explanations = JSON.parse(data);
        getVideoCount(CHANNEL_ID).then((count) => { 
            let list = [];
            for (let i = 0;i < count;i++){
                if(explanations[i].content == "" && idk) list = list.concat(i+1);
                if(explanations[i].content != "" && !explanations[i].locked && !idk) list = list.concat(i+1);
                //list = list.concat(i+1);
            }
            if (list.length < 1) {interaction.reply("No videos found"); return;}
            let randomvid = list[Math.floor(Math.random() * list.length)];
            console.log(randomvid);
            getNthVideo(CHANNEL_ID, randomvid).then((video) => {
                if (idk) message = `Not sure what to do? How about you help by explaining this video! \nUse /submit [[${randomvid}](${video.url})] and write an explanation for the video.`;
                if (!idk) message = `Wanna help out a little more in depth? How about you help make this explanation better! Use /explain [[${randomvid}](${video.url})] and /submit [[${randomvid}](<${video.url}>)]\nThe current explanation is:\n${explanations[randomvid-1].content}`;
                
                interaction.reply(message);
            }); 
        });
    });
}

function progress(interaction) {
    let thesilly = interaction.options.get("the-silly");
    if (thesilly === null) thesilly = false;
    if (thesilly.value != true) {
        fs.readFile("./src/scores/explanations.json", function (err, data) {
            let explanations = JSON.parse(data);
            getVideoCount(CHANNEL_ID).then((count) => {
                let locks = 0;
                let filled = 0;
                for (let i = 0; i < count; i++) {
                    if (explanations[i].locked) locks++;
                    if (explanations[i].content != "") filled++;
                }
                const hearts = [
                    ":pink_heart:", ":heart:", ":orange_heart:", ":yellow_heart:", 
                    ":green_heart:", ":light_blue_heart:", ":blue_heart:", 
                    ":purple_heart:", ":black_heart:", ":grey_heart:", 
                    ":white_heart:", ":brown_heart:", ":3", "<:smotsheart:1327432522518237254>"
                ];
                const randomHeart = hearts[Math.floor(Math.random() * hearts.length)];
                interaction.reply(`We have locked explanations for ${locks}/${count} or about ${Math.round((locks / count) * 100)}% and filled out explanations for ${filled}/${count} or about ${Math.round((filled / count) * 100)}% of videos! ${randomHeart}`);
            });
        });
    } else {
        interaction.reply(silly[Math.floor(Math.random() * silly.length)]);
    }
}
function remaining(interaction){
    let list = interaction.options.get("list");
    if (list === null) list = false;
    fs.readFile("./src/scores/explanations.json", function(err, data){
        let explanations = JSON.parse(data);
        getVideoCount(CHANNEL_ID).then((count) => {
            let locks = 0;
            let episodes = [];
            for (let i = 0;i < count;i++){
                if (!explanations[i].locked) {locks++; episodes = episodes.concat(i+1);}
            }
            interaction.reply(`We have ${locks} remaining videos to explain!`);
            if(list) interaction.user.send(episodes.toString());
        });
    });
}

function appoint(interaction){
    fs.readFile("./src/scores/mods.json", function(err, data){
        let mods = JSON.parse(data);
        let mod = mods.includes(interaction.user.id);

        
        if(!mod) {interaction.reply({content:"ur not a mod buckarro :joy: 🦐",ephemeral:true}); return;}
        
        let user = interaction.options.get("user");
        let username = user.user.globalName;
        if (username == null) username = user.user.username;
        if (mods.includes(user.value)) {interaction.reply(`${username} already is a mod.`); return;}
        mods = mods.concat(user.value);
        fs.writeFileSync("./src/scores/mods.json",JSON.stringify(mods, null, 2));

        interaction.reply(`Added ${username} to the list of mods.`);
    });
}






function explain(interaction){
    let lineNumber = interaction.options.get("episode");
    fs.readFile("./src/scores/explanations.json", function(err, data){
        let explanations = JSON.parse(data);
        getVideoCount(CHANNEL_ID).then((count) => {
            if (!lineNumber) lineNumber = {value:count};
            if (lineNumber > count) {interaction.reply("That video doesn't exist!");return;}
            let data = explanations[lineNumber.value-1];
            if (data.content == "") { 
                if (lineNumber.value > count){ interaction.reply("That video doesn't exist!"); return; }
                getNthVideo(CHANNEL_ID, lineNumber.value).then((video) => {
                    getCommentsByUser(video.videoId,"@MatttNguyen2").then((comment) => {
                        if (comment.length == 0) { interaction.reply(`No explanation for episode ${lineNumber.value}`); return;}
                        
                        message = comment[0].comment;
                        message = message.replaceAll("<br>","\n");
                        message = message.replaceAll("&quot;","\"");
                        message = message.replaceAll("&#39;","\'");
                        interaction.reply(`No community made explanation for episode ${lineNumber.value} instead trying to pull from @MatttNguyen2:\n${message}`)
                        console.log(comment);
                    });
                }); 
                return;
            }
            let text = data.content.replaceAll("<br>","\n");
            interaction.reply("Episode "+lineNumber.value+":\n"+text);
        });
    });
}


function submit(interaction){
    let line = interaction.options.get("episode");
    let content = interaction.options.get("content");
    fs.readFile("./src/scores/explanations.json", function(err, data){
        let explanations = JSON.parse(data);
        let i = line.value-1;
        getVideoCount(CHANNEL_ID).then((count) => { 
            if (line.value > count) { interaction.reply("That video doesn't exist!"); return;}
            if(explanations[i].locked){interaction.reply(`🔒 The explanation for ${line.value} is locked and can't be changed. 🔒`); return;}
            
            let username = interaction.user.globalName;
            if (username == null) username = interaction.user.username;
            
            let newUser = true;
            if (scoreboard.length > 0){
                for (let score = 0; score < scoreboard.length;score++) {
                    if (scoreboard[score].id == interaction.user.id) { scoreboard[score].score++; newUser = false; break; }
                }
            }
            if (newUser){ scoreboard = scoreboard.concat({"id":interaction.user.id,"name":username,"score":1});}
            scoreboard.sort((a, b) => b.score - a.score);
            fs.writeFileSync("./src/scores/scoreboard.json",JSON.stringify(scoreboard, null, 2));
            
            explanations[i].content = content.value;
            explanations[i].user.id = interaction.user.id;
            explanations[i].user.name = username;
            
            let text = explanations[i].content.replaceAll("<br>","\n");
            fs.writeFileSync("./src/scores/explanations.json",JSON.stringify(explanations, null, 2));
            interaction.reply(`Explanation submited for episode ${line.value}!\nEpisode ${i+1}:\n${text}`);
        });
    });
}

function lock(interaction){
    let urole = interaction.member.roles.cache.find(role => role.name === 'smots modding');
    let line = interaction.options.get("episode");
    let lockvalue = interaction.options.get("locked").value;
    fs.readFile("./src/scores/explanations.json", function(err, data){
        fs.readFile("./src/scores/mods.json", function(err, data2){
            let mods = JSON.parse(data2);
            let mod = mods.includes(interaction.user.id);
            let explanations = JSON.parse(data);
            let i = line.value-1;
            
            let lockmsg = "";
            if(!mod) {interaction.reply({content:"ur not a mod buckarro :joy: 🦐",ephemeral:true}); return;}
            getVideoCount(CHANNEL_ID).then((count) => { 
                if (line.value > count) { interaction.reply("That video doesn't exist!"); return;}
                explanations[i].locked = lockvalue;
                
                if (lockvalue) {lockmsg = "locked";} 
                else {lockmsg = "unlocked";}
                
                console.log(explanations[i]); // write to file
                fs.writeFileSync("./src/scores/explanations.json",JSON.stringify(explanations, null, 2));
                interaction.reply(`Explanation ${lockmsg} for episode ${line.value}!`);
            });
        });
    });
}




async function writeToLine(filePath,lineNumber,newContent){
    try {
        // Read the file content
        const data = await fs.promises.readFile(filePath, 'utf8');
    
        // Split the content into an array of lines
        const lines = data.split('\n');
    
        // Ensure the lineNumber is within bounds
        if (lineNumber < 0 || lineNumber >= lines.length) {
          throw new Error('Line number out of range');
        }
    
        // Replace the specific line
        lines[lineNumber] = newContent;
    
        // Join the lines back into a single string
        const updatedContent = lines.join('\n');
    
        // Write the updated content back to the file
        await fs.promises.writeFile(filePath, updatedContent, 'utf8');
      } catch (error) {
        console.error(`Error replacing line in file: ${error.message}`);
      }
}





function smots(interaction){
    let episode = interaction.options.get("episode");
    getVideoCount(CHANNEL_ID).then((count) => { 
        if (episode.value > count) {interaction.reply("That video doesn't exist!"); return;}
        getNthVideo(CHANNEL_ID, episode.value).then((video) => {
            interaction.reply(`Episode:[ ${episode.value}](${video.url})`);
        });
    });
}
function dailysmots(interaction){
    getVideoCount(CHANNEL_ID).then((count) => { 
        getLatestVideo(CHANNEL_ID).then((video) => {
            interaction.reply(`Episode:[ ${count}](${video.url})`);
        })
    });
}
function randomsmots(interaction){
    let message = "wow looks like this idiot doesn't know how to code";
    getVideoCount(CHANNEL_ID).then((count) => { 
        let randomvid = getRandomInt(1,count)
        getNthVideo(CHANNEL_ID, randomvid).then((video) => {
            message = (`Episode:[ ${randomvid}](${video.url})`);
            
            interaction.reply(message);
        }); 
    });
    
}

function comment(interaction){
    let user = interaction.options.get("user").value;
    let episode = interaction.options.get("episode").value;
    if(user[0] != "@"){user = "@"+user;}
    getNthVideo(CHANNEL_ID, episode).then((video) => {
        getCommentsByUser(video.videoId, user).then((comments) => {
            let message = `Comments by user ${user} on episode ${episode}:`;
            if (comments.length > 0) {
                for (let i = comments.length-1;i>=0;i--){
                    message = message + `\n\nComment ${-i+comments.length}:\n` + comments[i].comment;
                }
                message = message.replaceAll("<br>","\n");
                message = message.replaceAll("&quot;","\"");
                message = message.replaceAll("&#39;","\'");
                interaction.reply(message);
            } else {
                interaction.reply({content:"No such comments",ephemeral:true});
            }
        });
    });
}

function map(x1, y1, x2, y2, value) {
    return ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}





client.login(process.env.TOKEN);
