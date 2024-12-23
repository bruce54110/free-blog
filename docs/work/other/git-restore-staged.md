# git restore 和 git restore --staged 的区别

## git restore 

```bash
git restore <file>
```
表示将在工作空间但是不在暂存区的文件撤销更改
**示例：**

```bash
E:\JavaDev\template_workspace\zhw-free>git status                         
On branch master                                                          
Your branch is up to date with 'origin/master'.                           
                                                                          
Changes to be committed:                                                  
  (use "git restore --staged <file>..." to unstage)                       
        modified:   zhw-free-demo/src/main/resources/application.yml      
        new file:   zhw-free-demo/src/main/resources/logback-spring.xml   
                                                                          
Changes not staged for commit:                                            
  (use "git add <file>..." to update what will be committed)              
  (use "git restore <file>..." to discard changes in working directory)   
        modified:   .gitignore                                            
                                                                          
                                                                          
E:\JavaDev\template_workspace\zhw-free>                                   
E:\JavaDev\template_workspace\zhw-free>                                   
E:\JavaDev\template_workspace\zhw-free>                                   
E:\JavaDev\template_workspace\zhw-free>                                   
E:\JavaDev\template_workspace\zhw-free>                                   
E:\JavaDev\template_workspace\zhw-free>                                   
E:\JavaDev\template_workspace\zhw-free>git restore .gitignore             
                                                                          
E:\JavaDev\template_workspace\zhw-free>git status                         
On branch master                                                          
Your branch is up to date with 'origin/master'.                           
                                                                          
Changes to be committed:                                                  
  (use "git restore --staged <file>..." to unstage)                       
        modified:   zhw-free-demo/src/main/resources/application.yml      
        new file:   zhw-free-demo/src/main/resources/logback-spring.xml   
                                                                          
                                                                          
E:\JavaDev\template_workspace\zhw-free>                                   
```
之前已经将 zhw-free-demo/src/main/resources/application.yml  和 zhw-free-demo/src/main/resources/logback-spring.xml 两个文件使用`git add` 命令添加到了暂存区，.gitignore 文件是修改过，但没有 `git add` 的文件（不在暂存区）。使用`git restore .gitignore` 命令后，使用`git status` 查看文件状态，发现.gitignore 文件的更改被撤销了。

## git restore --staged
```bash
git restore --staged <file>
```
作用是将暂存区的文件从暂存区撤出，但不会更改文件
**示例：**
这里我们演示完整的过程，从更改文件到添加到暂存区再到从暂存区撤出
 1. 初始状态
```bash
E:\JavaDev\template_workspace\zhw-free>git status
On branch master
Your branch is up to date with 'origin/master'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   zhw-free-demo/src/main/resources/application.yml
        new file:   zhw-free-demo/src/main/resources/logback-spring.xml


E:\JavaDev\template_workspace\zhw-free>
```

2. 手动修改一下 .gitignore文件，再查看状态
```bash
	E:\JavaDev\template_workspace\zhw-free>git status
On branch master
Your branch is up to date with 'origin/master'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   zhw-free-demo/src/main/resources/application.yml
        new file:   zhw-free-demo/src/main/resources/logback-spring.xml

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   .gitignore


E:\JavaDev\template_workspace\zhw-free>	
```
3. 使用 `git add .gitignore` 将 .gitignore 文件添加到暂存区
```bash
E:\JavaDev\template_workspace\zhw-free>git add .gitignore

E:\JavaDev\template_workspace\zhw-free>git status
On branch master
Your branch is up to date with 'origin/master'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   .gitignore
        modified:   zhw-free-demo/src/main/resources/application.yml
        new file:   zhw-free-demo/src/main/resources/logback-spring.xml


E:\JavaDev\template_workspace\zhw-free>
```
4. 重点来了，我们使用`git restore  --staged` 将.gitognore 文件存暂存区撤出
```bash
E:\JavaDev\template_workspace\zhw-free>
E:\JavaDev\template_workspace\zhw-free>git restore --staged .gitignore

E:\JavaDev\template_workspace\zhw-free>git status
On branch master
Your branch is up to date with 'origin/master'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   zhw-free-demo/src/main/resources/application.yml
        new file:   zhw-free-demo/src/main/resources/logback-spring.xml

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   .gitignore


E:\JavaDev\template_workspace\zhw-free>
E:\JavaDev\template_workspace\zhw-free>
E:\JavaDev\template_workspace\zhw-free>
```

 ## 总结
 `git restore --staged` 将文件从暂存区撤出，但不会撤销文件的更改  
 `git resore` 将不在暂存区的文件撤销更改