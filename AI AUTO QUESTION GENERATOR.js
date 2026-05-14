async function generateQuestion(subject) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Create a multiple choice question for ${subject}`
          }
        ]
      })
    });
  
    const data = await response.json();
    console.log(data.choices[0].message.content);
  }
  