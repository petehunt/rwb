require 'json'
require 'fileutils'

EXAMPLE_DIR = File.expand_path('./example')

desc "Reset rwb example directory (#{EXAMPLE_DIR})"
task :reset_example do
  print 'Resetting example files... '
  FileUtils.rm_rf EXAMPLE_DIR
  FileUtils.mkdir_p EXAMPLE_DIR
  Dir.chdir EXAMPLE_DIR
  puts 'Done!'

  # Create default package.json file
  print 'Initialising npm... '
  `npm init -y 2>&1 >/dev/null`
  puts 'Done!'

  # Modify package.json
  File.open('./package.json', File::RDWR|File::CREAT, 0644) do |f|
    begin
      pkg = JSON.parse(f.read)
    rescue
      abort 'Unable to read package.json :('
    end

    pkg['main'] = 'MyComponent.js'
    pkg['description'] = 'rwb demotron'
    # Silence 'no repository' warning
    pkg['private'] = true

    # Write modified package.json file
    f.rewind
    f.write JSON.pretty_generate(pkg)
    f.flush
    f.truncate(f.pos)
  end

  print 'Initialising rwb... '
  `rwb init`
  puts 'Done!'

  print 'Installing packages from NPM... '
  `npm i 2>&1 >/dev/null`
  puts 'Done!'

  print 'Generating static site... '
  `rwb static`
  puts 'Done!'
end
