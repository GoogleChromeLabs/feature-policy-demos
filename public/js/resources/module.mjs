window.didExecuteModule = true;
console.log('didExecuteModule');
const src = new URL(import.meta.url).pathname;

const thisScriptTag = document.querySelector(`script[src*="${src}"]`);
thisScriptTag.dataset.ran = true;
