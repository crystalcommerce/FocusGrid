require 'rake'
require 'bundler'
Bundler.require :rake

namespace :spec do
  desc "Set up Jasmine"
  task :init do
    sh "jasmine init"
  end
end
load "jasmine/tasks/jasmine.rake"

task :clean do
  sh "rm -rf pkg"
end

"Minify focusgrid. Move it and dependencies to pkg/"
task :build => %w[pkg/jquery.min.js pkg/jquery.focusgrid.min.js]

namespace :build do
  directory 'pkg'
  file 'pkg/jquery.min.js' => ['pkg', 'lib/jquery.min.js'] do
    cp 'lib/jquery.min.js', 'pkg/jquery.min.js'
  end

  file 'pkg/jquery.focusgrid.js' => ['pkg', 'lib/jquery.focusgrid.js'] do
    cp 'lib/jquery.focusgrid.js', 'pkg/jquery.focusgrid.js'
  end

  file 'pkg/jquery.focusgrid.min.js' => 'pkg/jquery.focusgrid.js' do
    minify 'pkg/jquery.focusgrid.js', 'pkg/jquery.focusgrid.min.js'
  end

  def minify(source, dest)
    File.open(dest, 'w') do |f|
      f.write(JSMin.minify(File.read(source)))
    end
  end
end