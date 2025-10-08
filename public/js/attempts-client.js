// attempts-client.js
// Generic helpers to save quiz attempts to the backend and to extract items from quiz pages
// that mark the correct choice via value="true" on <input type="radio">.

(function(){  
  // const API_BASE = ""; // set to e.g. "http://localhost:5500" if frontend and backend are on different origins
  
const API_BASE =
  window.location.hostname === "localhost"
	? ""                                          // local development
	: "https://english-adjuster-v1.onrender.com"; // Render backend

  async function saveAttempt(payload){
    try{
      const token = localStorage.getItem("token");
      if(!token){
        console.warn("[attempts-client] No token in localStorage — not saving attempt.");
        return;
      }
      const res = await fetch(`${API_BASE}/api/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if(!res.ok){
        const text = await res.text();
        throw new Error(text);
      }
      const data = await res.json();
      console.log('[attempts-client] Saved attempt', data._id || data);
      return data;
    }catch(err){
      console.error('[attempts-client] Failed to save attempt', err);
    }
  }

  // Extract question-level details from a quiz form
  // Assumptions:
  //  - Each question is wrapped in a card-like block (we fall back to labels under the form)
  //  - Each option is a <label> that contains an <input type="radio" name="qN" value="...">
  //  - The correct option has value="true" (your current pattern)
  function buildItemsFromForm(form){
    const blocks = form.querySelectorAll('.bg-white.p-6.rounded-lg.shadow');
    const items = [];

    const questionBlocks = blocks.length ? blocks : [form];

    let qIndex = 0;
    questionBlocks.forEach((block)=>{
      // For each block, assume one question
      const h3 = block.querySelector('h3');
      const qText = h3 ? (h3.textContent || '').replace(/^Question\s*\d+[:\.\s]*/i,'').trim() : `Q${qIndex+1}`;

      // Collect options in this block by name
      const inputs = block.querySelectorAll('input[type="radio"]');
      if(!inputs.length) return;

      // Use the first radio's name to locate the chosen one
      const name = inputs[0].name;
      const group = [...form.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`)];
      const labels = group.map(inp => {
        const lab = inp.closest('label');
        const text = lab ? lab.textContent.trim() : inp.value;
        return { inp, text };
      });

      const chosen = form.querySelector(`input[type="radio"][name="${CSS.escape(name)}"]:checked`);
      const userAnswer = chosen ? (chosen.closest('label')?.textContent.trim() || chosen.value) : null;

      const correctInp = group.find(i => i.value === 'true');
      const correctAnswer = correctInp ? (correctInp.closest('label')?.textContent.trim() || 'true') : null;

      items.push({
        questionId: String(++qIndex),
        questionText: qText,
        choices: labels.map(l => l.text),
        correctAnswer,
        userAnswer,
        isCorrect: !!(userAnswer && correctAnswer && userAnswer === correctAnswer)
      });
    });

    return items;
  }

  // Expose to window
  window.__attemptsClient = { saveAttempt, buildItemsFromForm };
})();
