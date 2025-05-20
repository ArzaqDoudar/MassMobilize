// require('dotenv').config();
import 'dotenv/config'

import { hardCodesList, usersnameList, twitterAccounts } from './staticData.js';
let user = null;
let cookie = null;
var campaigns = []
var campaignData = {};
var filterdTweetsArray = []
const tweetsIdSet = new Set()
const userPerRequest = 10 //TODO change this to 10
const numOfCycles = (twitterAccounts.length / userPerRequest)

const options = { method: 'GET', headers: { Authorization: `Bearer ${process.env.BEARER_TOKEN}` } };

// this function used to return the user id from the user name in x platform
const GetUserIdFromUsername = async (username) => {
    const url = `https://api.twitter.com/2/users/by/username/${username}`;
    const res = await fetch(url, options)
    const data = await res.json();
    return data.data?.id;
}
// this function used retrieve last 10 tweets the user was posted
const GetUserTweets = async (userId) => {
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000); //2hours
    const startTime = twoHoursAgo.toISOString();
    console.log("startTime", startTime);
    // const url = `https://api.twitter.com/2/users/${userId}/tweets?exclude=retweets,replies&tweet.fields=created_at,text`;
    const url = `https://api.twitter.com/2/users/${userId}/tweets?exclude=retweets,replies&tweet.fields=created_at,text&expansions=attachments.media_keys&media.fields=url,type&start_time=${startTime}`;
    const res = await fetch(url, options)
    const data = await res.json();
    // return data.data;
    return data;
}
// this function used to filter the tweets by the hardcoded list
const FilterTweetsArray = (tweets, username) => {

    let media = tweets.includes ? tweets.includes.media : []
    let tweetsArray = []
    console.log(`Filter the ${tweets.data.length}  tweets ${username} user : ----------------------- `);
    tweets.data.map((tweet) => {
        for (let index = 0; index < hardCodesList.length; index++) {
            const hardCode = hardCodesList[index];
            if (tweet.text.includes(hardCode)) {
                if (!tweetsIdSet.has(tweet.id)) { // check if this tweet alreaddy added as campaign or not
                    tweetsIdSet.add(tweet.id) // if not , add it to the set and insert it to the fillterd array
                    const url = `https://x.com/${username}/status/${tweet.id}`;
                    tweetsArray.push(
                        { id: tweet.id, createdBy: username, text: tweet.text, url: url, createdAt: tweet.created_at }
                    )
                    break
                } else { console.log("it's a duplicated tweet"); }
            }
        }
    })
    return tweetsArray
}


// send requests to Mass Mobilize Backend to login as "admin" and get the cookie and user informations
const Login = async (username, password) => {

    await fetch(`${process.env.SERVER_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, password, password }),
    }).then(async data => {
        user = (await data.json()).user;
        const cookies = data.headers.getSetCookie();
        cookie = cookies
        console.log('Login Successduly ........',);
        console.log('Loged in user = ', user.username);

    }).catch(console.error())
}

// this function used to fill the campaign object 
const SetCampaignData = (data) => {

    campaignData = {
        "title": data.title,
        "description": data.description,
        "actionUrl": data.actionUrl,
        "actionType": data.actionType,
        "tweetText": data.tweetText || "",
        "imageUrl": data.imageUrl || null,
        "createdById": data.createdById || 1,
        "startDate": data.startDate || null,
        "endDate": data.endDate || null,
        "isActive": true,
    }
    // campaignData = {
    //     "title": "test report from external backend 3",
    //     "description": "report tweet",
    //     "actionUrl": "https://x.com/netanyahu/status/1918725267238834507",
    //     "actionType": "report",
    //     "tweetText": "",
    //     "imageUrl": null,
    //     "createdById": 1,
    //     "startDate": null,
    //     "endDate": null,
    //     "isActive": true,
    // };
}

// send request to MM backend with campaign data to ceate new one 
const SendCampaign = async (data) => {
    await fetch(`${process.env.SERVER_URL}/api/campaigns`, {
        method: "POST",
        headers: {
            Cookie: cookie,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    }).then(
        async response => {
            const data = await response.json()
            if (response.status == 201) {
                // save new campaigns in the array to check it after 2 days
                const createdAt = new Date()
                campaigns.push({
                    "id": data.id,
                    "createdAt": createdAt
                })
                console.log('Campaign Creates Succesfully ... \n Campaign id = ', data.id, " at = ", createdAt)
            }
        }
    ).catch(error => { console.error() })

}

const TwitterPart = async (twitterAccounts) => {

    await Promise.all(twitterAccounts.map(async (account) => {

        const userId = account.id
        if (userId) {
            console.log('username  = ', account.username, ' , userId = ', userId);
            const tweets = await GetUserTweets(userId)
            if (tweets.data) {
                const tempArray = FilterTweetsArray(tweets, account.username)
                filterdTweetsArray.push(...tempArray)
            } else {
                console.log('No Tweets founded for user ', account.username);
            }
        } else {
            console.log(account.username, ' account not foud..................');
        }
    }))
    console.log('filterdTweetsArraylength :   ', filterdTweetsArray.length);

}

const MMPart = async () => {
    if (user && cookie && filterdTweetsArray.length > 0) {
        filterdTweetsArray.map(async (item) => {
            SetCampaignData({
                "title": `${item.createdBy} tweet `,
                "description": `${item.text}`,
                "actionUrl": item.url,
                "actionType": "report",
            })
            await SendCampaign(campaignData);
        })
    }
}

const DeletePart = async () => {
    // get the time 2 days ago
    const now = new Date()
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(now.getDate() - 2)
    console.log('twoDaysAgo = ', twoDaysAgo);
    // filter campaigns array
    console.log('campaigns befor delete = ', campaigns);
    const filterdCampaignsToDelete = []
    campaigns.map((campaign, index) => {
        if (new Date(campaign.createdAt) < twoDaysAgo) { //TODO : change the > to <
            filterdCampaignsToDelete.push(campaign)
            campaigns = campaigns.slice(index, index)
        }
    })

    console.log('filterdCampaignsToDelete = ', filterdCampaignsToDelete);
    console.log('campaigns = ', campaigns);
    // delete the capmaigns
    filterdCampaignsToDelete.map(campaign => DeleteCampaign(campaign.id))

}


let intervalId;
let runCount = 0;
const runTask = async () => {
    filterdTweetsArray = [] // clear array
    console.log(`cycle ${runCount} at ${new Date().toLocaleString()}`);
    const startPoint = runCount * userPerRequest
    await TwitterPart(twitterAccounts.slice(startPoint, startPoint + userPerRequest));
    await MMPart();
    runCount++


    if (runCount >= numOfCycles) {
        clearInterval(intervalId);
        runCount = 0;



        setTimeout(() => {
            console.log('1 hour wait finished. Restarting 15-minute cycle...');
            // delete campaigns
            DeletePart()
            startInterval();
        }, 75 * 60 * 1000); // 1:15 hour = 4500000 ms //TODO: change 1 to 60
    }

}
const startInterval = () => {
    filterdTweetsArray = []
    runTask();
    intervalId = setInterval(runTask, 15 * 60 * 1000); // 15 minutes = 900000 ms //TODO change 1 to 15
}

const DeleteCampaign = async (id) => {
    await fetch(`${process.env.SERVER_URL}/api/campaigns/${id}/delete`, {
        method: "POST",
        headers: {
            Cookie: cookie,
            'Content-Type': 'application/json',
        },
    }).then(
        async response => {
            const data = await response.json()
            console.log('data', data);
        })
}

(async () => {
    try {
        // const id = await GetUserIdFromUsername("test_arzaq")
        // console.log('id', id);

        await Login(process.env.LOGIN_USERNAME, process.env.LOGIN_PASSWORD)
        startInterval()

    } catch (error) {
        console.log('Error: ', error);
    }
})();