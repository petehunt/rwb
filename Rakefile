require 'json'
require 'fileutils'
require 'webrick'
require 'benchmark'

PWD = File.dirname(__FILE__)
RWB = File.expand_path('./lib/main.js', PWD)
EXAMPLE_DIR = File.expand_path('./example', PWD)
SERVER_PORT = 8000

desc "Reset rwb example directory (#{EXAMPLE_DIR})"
task :reset_example do
  Benchmark.bm(30) do |x|
    Dir.chdir(PWD)
    `npm link`

    x.report('Resetting example files...') {
      FileUtils.rm_rf EXAMPLE_DIR
      FileUtils.mkdir_p EXAMPLE_DIR
      Dir.chdir EXAMPLE_DIR
    }

    # Create default package.json file
    x.report('Initialising npm...') {system 'npm init -y'}
    x.report('Initialising rwb...') {system "#{RWB} init"}

    # Modify package.json
    x.report('Updating package.json...') {
      File.open('./package.json', File::RDWR|File::CREAT, 0644) do |f|
        begin
          pkg = JSON.parse(f.read)
        rescue
          abort 'Unable to read package.json :('
        end

        pkg['description'] = 'rwb demotron'
        # Silence 'no repository' warning
        pkg['private'] = true

        # Write modified package.json file
        f.rewind
        f.write JSON.pretty_generate(pkg)
        f.flush
        f.truncate(f.pos)
      end
    }

    x.report('Installing packages from NPM...') {system "npm link rwb; npm i"}
    x.report('Generating static site...') {system "#{RWB} static"}
  end
end

task :serve do
  Dir.chdir EXAMPLE_DIR
  system "#{RWB} serve"
end

task :serve_static do
  Dir.chdir File.expand_path('./dist', EXAMPLE_DIR)
  server = WEBrick::HTTPServer.new :Port => SERVER_PORT, :DocumentRoot => '.'
  trap 'INT' do server.shutdown end
  `open "http://localhost:#{SERVER_PORT}"`
  server.start
end

task :reset_and_serve => [:reset_example, :serve_static]
