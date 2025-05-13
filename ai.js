// Please install OpenAI SDK first: `npm install openai`

import axios from "axios";
import OpenAI from "openai";

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-c09b6048fce24cbdbca252fb3cbc0cac'
});

async function main() {

    try {
        const data = {
            model: "deepseek-chat",
            messages: [{ role: "system", content: "You are a helpful assistant." }],
            stream: false
        }

        axios.post('https://api.deepseek.com/chat/completions', data, {
            headers: {
                'Authorization': `Bearer sk-6bca8a4b714240e78567ecdadeda39f3`,
                'Content-Type': 'application/json'
            },
        }).then(response => {
            if (response) {
                console.log('response', response.data.choises[0].messages);
            } else {
                console.log('no response');
            }
        })


    } catch (error) {

        console.log('error', error);
    }


    // const completion = await openai.chat.completions.create({
    //     messages: [{ role: "system", content: "You are a helpful assistant." }],
    //     model: "deepseek-chat",
    //     stream: false,
    // });

    // console.log(completion.choices[0].message.content);
    // const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    //     method: 'POST',
    // headers: {
    //     'Authorization': `Bearer sk-c09b6048fce24cbdbca252fb3cbc0cac`,
    //     'Content-Type': 'application/json'
    // },
    //     body: JSON.stringify({
    //         model: "deepseek-chat",
    //         messages: [
    //             { role: "user", content: "Hello" }
    //         ]
    //     })
    // });
    // console.log('response', response);
}

main();