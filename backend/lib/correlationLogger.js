// High-performance structured logger
function info(message, metadata = {}) {
  console.log(JSON.stringify({ level: 'INFO', time: new Date().toISOString(), message, ...metadata }));
}

function warn(message, metadata = {}) {
  console.warn(JSON.stringify({ level: 'WARN', time: new Date().toISOString(), message, ...metadata }));
}

function error(message, metadata = {}) {
  console.error(JSON.stringify({ level: 'ERROR', time: new Date().toISOString(), message, ...metadata }));
}

module.exports = { info, warn, error };
