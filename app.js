// require('dotenv').config();
import 'dotenv/config'

import { hardCodesList, usersnameList, tweetsStaticData } from './staticData.js';
let user = null;
let cookie = null;
const campaignData = {};

const options = { method: 'GET', headers: { Authorization: `Bearer ${process.env.BEARER_TOKEN}` } };

// this function used to return the user id from the user name in x platform
async function getUserIdFromUsername(username) {
    const url = `https://api.twitter.com/2/users/by/username/${username}`;

    const res = await fetch(url, options)


    const data = await res.json();
    return data.data?.id;
}
// this function used retrieve last 10 tweets the user was posted
async function getUserTweets(userId) {
    const url = `https://api.twitter.com/2/users/${userId}/tweets?exclude=retweets,replies&tweet.fields=created_at,text`;
    // const url = `https://api.twitter.com/2/users/${userId}/tweets`;

    // const res = await fetch(url, {
    //     headers: {
    //         'Authorization': `Bearer ${process.env.BEARER_TOKEN}`
    //     }
    // });
    const res = await fetch(url, options)

    const data = await res.json();
    return data.data;
    // return data;
}
// this function used to filter the tweets by the hardcoded list
function fillTweetsArray(tweets, username) {
    let tweetsArray = []
    console.log('inseide filter fun');
    tweets.map((tweet) => {
        for (let index = 0; index < hardCodesList.length; index++) {
            const hardCode = hardCodesList[index];
            if (tweet.text.includes(hardCode)) {
                tweetsArray.push(
                    { id: tweet.id, text: tweet.text, url: `https://x.com/${username}/status/${tweet.id}` }
                )
                break
            }
        }

    })
    return tweetsArray
}


// send requests to Mass Mobilize Backend to login as "admin" and get the cookie and user informations
const Login = async (username, password) => {

    await fetch("https://52bb672e-fcf6-4120-ac2a-9c6e34fb16a0-00-1d84z038fbfhk.spock.replit.dev/api/auth/login", {
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
const setCampaignData = (data) => {

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
        "participantCount": 0,
        "creator": user,
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
    //     "participantCount": 0,
    //     "creator": user,

    // };
}

// send request to MM backend with campaign data to ceate new one 
const SendCampaign = async (data) => {
    await fetch("https://52bb672e-fcf6-4120-ac2a-9c6e34fb16a0-00-1d84z038fbfhk.spock.replit.dev/api/campaigns", {
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
                console.log('Campaign Creates Succesfully ... ', data)
            }
        }
    ).catch(error => { console.error() })

}

(async () => {
    try {
        // await Login("admin", "adminpass")
        // if (user && cookie) {
        //     SendCampaign({
        //         "title": "test 13 may",
        //         "description": "report tweet",
        //         "actionUrl": "https://x.com/netanyahu/status/1918725267238834507",
        //         "actionType": "report",
        //     })
        //     await SendCampaign(campaignData);
        // }

        usersnameList.map(async (username) => {

            const userId = await getUserIdFromUsername(username)
            if (userId) {
                const tweets = await getUserTweets(userId)
                const filterdTweetsArray = fillTweetsArray(tweets, username)

                console.log('username  = ', username, 'userId = ', userId);
                console.log('tweets:   ', tweets);
                console.log('fillTweetsArray :   ', filterdTweetsArray);

            } else {
                console.log('user not foud..................');
            }
        })
    } catch (error) {
        console.log('Error: ', error);
    }
})();