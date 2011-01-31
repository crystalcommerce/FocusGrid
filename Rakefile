require 'rake'
require 'bundler'
Bundler.require :rake

task :clean do
  sh "rm -rf pkg"
end

desc "Minify focusgrid. Move it and dependencies to pkg/"
task :build => %w[pkg/jquery.min.js pkg/jquery.focusgrid.min.js]

namespace :build do
  directory 'pkg'

  file 'pkg/jquery.focusgrid.js' => ['pkg', 'public/javascript/jquery.focusgrid.js'] do
    cp 'public/javascript/jquery.focusgrid.js', 'pkg/jquery.focusgrid.js'
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
