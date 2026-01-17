// Global Configuration
const OLLAMA_URL = `http://${window.location.host}:11434/api/generate`;
const OLLAMA_MODEL = 'ministral-3:8b'; 

const canvas = document.getElementById('canvas');
const dropZone = document.getElementById('drop-zone');

// 1. Capture Pasted Image
window.addEventListener('paste', async (e) => {
    const item = e.clipboardData.items[0];
    if (item && item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Image = event.target.result.split(',')[1];
            processImage(base64Image);
        };
        reader.readAsDataURL(blob);
    }
});

// 2. Send to Ollama
async function processImage(base64Data) {
    dropZone.innerText = "Analyzing image... (this may take a moment)";
    
    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: "List exactly 16 words found in this image. Return ONLY a JSON object with a key 'words' containing an array of strings.",
                images: [base64Data],
                stream: false,
                format: "json"
            })
        });

        if (!response.ok) throw new Error("Failed to connect to Ollama");

        const data = await response.json();
        const parsed = JSON.parse(data.response);
        renderWords(parsed.words);
        dropZone.innerText = "Words loaded! Drag them to reorganize.";
    } catch (err) {
        console.error(err);
        dropZone.innerText = "Error: Check console or ensure OLLAMA_ORIGINS='*' is set.";
    }
}

// 3. Render in Grid & Add Drag Logic
function renderWords(words) {
    canvas.innerHTML = '';
    
    const padding = 20;
    const boxWidth = 120;
    const boxHeight = 50;
    const columns = 4; // 4x4 grid for 16 words

    words.forEach((word, i) => {
        const div = document.createElement('div');
        div.className = 'word-box';
        div.innerText = word;
        
        // Calculate Grid Position
        const col = i % columns;
        const row = Math.floor(i / columns);
        
        const x = padding + (col * (boxWidth + padding));
        const y = padding + (row * (boxHeight + padding));
        
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.width = `${boxWidth}px`; // Fixed width for uniform grid
        
        makeDraggable(div);
        canvas.appendChild(div);
    });
}

function makeDraggable(el) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    el.onmousedown = (e) => {
        e.preventDefault();
        // Bring clicked box to front
        el.style.zIndex = 1000;
        
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
            el.style.zIndex = 'auto';
        };
        
        document.onmousemove = (e) => {
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
        };
    };
}
