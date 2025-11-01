 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/script.js b/script.js
index bc619bb468a985556d398fd4811c87da67869c0a..e00b870f5a7076b7045624f30d44bba6a3b25e75 100644
--- a/script.js
+++ b/script.js
@@ -1,37 +1,38 @@
 // BCSI 9020 – Materials Science Review
 // Minimal Academic Quiz (one-at-a-time) with summary review of incorrect answers.
 // Supports two question types: "multiple_choice" and "fill_blank".
 // Starts fresh on every load. No user identity or remote storage.
 // JSON files must be in the same folder (Week 4 & Week 5).
 
 const els = {
   setupCard: document.getElementById('setup-card'),
   quizCard: document.getElementById('quiz-card'),
   summaryCard: document.getElementById('summary-card'),
   topic: document.getElementById('topic'),
   startBtn: document.getElementById('start-btn'),
+  setupError: document.getElementById('setup-error'),
   progress: document.getElementById('progress'),
   score: document.getElementById('score'),
   qText: document.getElementById('question-text'),
   options: document.getElementById('options'),
   fillin: document.getElementById('fillin'),
   fillinInput: document.getElementById('fillin-input'),
   submitFillin: document.getElementById('submit-fillin'),
   feedback: document.getElementById('feedback'),
   nextBtn: document.getElementById('next-btn'),
   finalScore: document.getElementById('final-score'),
   wrongList: document.getElementById('wrong-list'),
   restartBtn: document.getElementById('restart-btn'),
 };
 
 // State
 let questions = [];
 let currentIndex = 0;
 let score = 0;
 let wrongAnswers = [];
 let answered = false;
 
 // Helpers
 function shuffle(arr){
   for(let i = arr.length - 1; i > 0; i--){
     const j = Math.floor(Math.random() * (i + 1));
@@ -59,63 +60,83 @@ function setProgress(){
   els.progress.textContent = `Question ${Math.min(currentIndex + 1, questions.length)} of ${questions.length}`;
   els.score.textContent = `Score: ${score}`;
 }
 
 function show(el){ el.classList.remove('hidden'); }
 function hide(el){ el.classList.add('hidden'); }
 
 function lockUI(){
   // Disable buttons/inputs after answering
   const btns = els.options.querySelectorAll('button');
   btns.forEach(b => b.disabled = true);
   els.submitFillin.disabled = true;
   els.fillinInput.disabled = true;
 }
 
 function resetUI(){
   els.options.innerHTML = '';
   els.fillinInput.value = '';
   els.fillinInput.disabled = false;
   els.submitFillin.disabled = false;
   els.feedback.textContent = '';
   els.feedback.className = 'feedback';
   hide(els.nextBtn);
 }
 
+function setSetupError(msg){
+  if(!els.setupError) return;
+  if(msg){
+    els.setupError.textContent = msg;
+    show(els.setupError);
+  }else{
+    els.setupError.textContent = '';
+    hide(els.setupError);
+  }
+}
+
 async function startQuiz(){
   const file = els.topic.value;
+  setSetupError('');
+  els.startBtn.disabled = true;
   try{
     const res = await fetch(file);
     if(!res.ok) throw new Error(`Failed to load ${file}`);
     const data = await res.json();
+    if(!Array.isArray(data)){
+      throw new Error('Quiz data must be an array of questions.');
+    }
     questions = shuffle([...data]);
   }catch(err){
-    alert('Could not load quiz data. Make sure the JSON files are present.
-' + err.message);
+    console.error(err);
+    const msg = err && err.message ? `Could not load quiz data. ${err.message}` : 'Could not load quiz data.';
+    setSetupError(msg);
+    els.startBtn.disabled = false;
     return;
   }
 
+  els.startBtn.disabled = false;
+
   currentIndex = 0;
   score = 0;
   wrongAnswers = [];
   answered = false;
 
   hide(els.setupCard);
   hide(els.summaryCard);
   show(els.quizCard);
 
   renderCurrent();
 }
 
 function renderCurrent(){
   resetUI();
   setProgress();
 
   const q = questions[currentIndex];
   els.qText.textContent = q.question ?? '';
 
   // Decide type
   const type = q.type || (q.options ? 'multiple_choice' : 'fill_blank');
 
   if(type === 'multiple_choice'){
     showMultipleChoice(q);
   } else {
@@ -231,42 +252,44 @@ function showSummary(){
     els.wrongList.appendChild(p);
   }else{
     wrongAnswers.forEach((w, idx) => {
       const wrap = document.createElement('div');
       wrap.className = 'wrong-item';
       const q = document.createElement('p');
       q.className = 'wrong-q';
       q.textContent = `${idx + 1}. ${w.question}`;
       const ua = document.createElement('p');
       ua.className = 'wrong-a';
       ua.textContent = `Your answer: ${w.userAnswer}`;
       const ca = document.createElement('p');
       ca.className = 'wrong-c';
       ca.textContent = `Correct answer: ${w.correctAnswer}`;
       wrap.append(q, ua, ca);
       els.wrongList.appendChild(wrap);
     });
   }
 }
 
 function restart(){
   // Return to setup screen (fresh start)
   hide(els.quizCard);
   hide(els.summaryCard);
   show(els.setupCard);
+  els.startBtn.disabled = false;
+  setSetupError('');
   answered = false;
   currentIndex = 0;
   score = 0;
   wrongAnswers = [];
   els.feedback.textContent = '';
   els.options.innerHTML = '';
   els.fillinInput.value = '';
   setProgress();
 }
 
 // Wire up
 els.startBtn.addEventListener('click', startQuiz);
 els.nextBtn.addEventListener('click', nextQuestion);
 els.restartBtn.addEventListener('click', restart);
 
 // Footer year
 document.getElementById('year').textContent = new Date().getFullYear();
 
EOF
)
