const Http = require('http');
const Stream = require('stream');
const DataDrift = require('data-drift');


// Write debug info
console.debug(`${process.execPath} ${process.execArgv.join(' ')} ${process.argv.slice(1).join(' ')}

  Debug Info
  --------------------
  
  JSVM: ${process.release.name} ${process.release.lts ? process.release.lts : '[no LTS]'} ${process.platform} ${process.arch}
  Versions:
${Object.keys(process.versions).map(lib => `    ${lib}: ${process.versions[lib]}`).join('\n')}
  Environment: ${JSON.stringify(process.env)}
`);


// Write welcome message
console.info('Welcome to NSSTC Nexus!\n');


// Init Nexus
console.info('Initialize Nexus...');
process.exitCode = 0;
process.title = 'NSSTC Nexus';


// Initialize data-drift
console.info('Initialize Data-Drift...');
const pipeline = new DataDrift();


// Initialize steps
console.info('Initialize Dummy Source...');
const source = new Stream.Readable({ objectMode: true, });

source._read = function() {};


console.info('Initialize Dummy Transform...');
const trans = new Stream.Transform({ objectMode: true, });

trans._transform = function(data, _, cb) {
    data.data = 'Transformed!';
    cb(null, data);
};


console.info('Initialize Dummy Drain...');
const drain = new Stream.Writable({ objectMode: true, });

drain._write = function (chunk) {
    chunk.state.res.writeHead(200, { 'Content-Type': 'text/plain' });
    chunk.state.res.end(chunk.data);
};


console.info('Initialize HTTP Server...');
const server = Http.createServer((req, res) => {
    source.push({
        data: 'okay',
        state: {
            req,
            res,
        },
    });
});

server.listen(8080);


pipeline.registerSegment(DataDrift.SegmentType.SOURCE, source);
pipeline.registerSegment(DataDrift.SegmentType.DRAIN, drain);
pipeline.registerSegment(DataDrift.SegmentType.WORKER, trans);


// Run
console.info('Run pipeline...');
pipeline.buildPipeline();
