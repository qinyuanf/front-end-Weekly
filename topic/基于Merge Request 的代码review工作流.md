## 如何落地基于 Merge Request 的代码 review 工作流（by 元丰）

### 基本流程

1、接到新需求后需求负责人从 master 上创建需求分支（格式如，**test_项目名称_创建者名称_日期**）；

2、开发人员从需求分支上拉取任务分支进行需求开发（格式如，**20190816_任务名称_创建者名称_dev**）；

3、当在开发人员任务开发完成之后创建 merge request，目标分支指向需求分支，并指向对应相关 review 人员；

![review-1](https://github.com/qinyuanf/front-end-Weekly/blob/master/screenshot/review/review-1.png "review-1")
![review-2](https://github.com/qinyuanf/front-end-Weekly/blob/master/screenshot/review/review-2.png "review-2")

4、编辑 mr 详情，包括主题、描述、review 人员、确认分支信息等；

![review-3](https://github.com/qinyuanf/front-end-Weekly/blob/master/screenshot/review/review-3.png "review-3")
![review-4](https://github.com/qinyuanf/front-end-Weekly/blob/master/screenshot/review/review-4.png "review-4")

5、**Resolve conflicts：** 当前 mr 代码冲突，若冲突简单可选择在线解决；若问题复杂，考虑本地解决；其他界面信息见截图详情；

![review-5](https://github.com/qinyuanf/front-end-Weekly/blob/master/screenshot/review/review-5.png "review-5")

6、**多人 review：** 在评论区通过"@XXX"来实现，被@的成员可在 **Todos** 找到消息通知，点击 **Mark todo as done** 来更新状态；

![review-6](https://github.com/qinyuanf/front-end-Weekly/blob/master/screenshot/review/review-6.png "review-6")

7、利用代码评论功能进行互动，并且每一条代码修改建议都会以邮件的形式通知开发者。

![review-7](https://github.com/qinyuanf/front-end-Weekly/blob/master/screenshot/review/review-7.png "review-7")

***
** 2019.10.02 更新 **

### 如何落地？

#### 具体流程

1. 接到需求，需求负责人从 **master** 上拉取 codeReview 分支，**review_项目名称_创建者名称_日期**；
2. 开发者从 review 分支拉取开发分支（单个或多个），**日期_任务名称_创建者名称_dev**；
3. 开发者**下班前**（每天或间隔一两天）按照功能点复杂度从开发分支提 mr 到 review 分支；
4. 小团队内部在提交 mr 后可以在内部群里发布通知，提醒相关人员及时 review，但为了养成定时 review 的习惯，希望每位开发者**每天早上**都能及时查看 review 通知；
5. 提测阶段，分两种情况：
- 若有多个开发分支，合并为**debug_项目名称_创建者名称_日期**后进行统一提测，后续修改问题也使用该分支；
- 若仅有一个开发分支，直接提测，后续修改也在该开发分支；
6. 提测后将依据场景使用 debug 分支或开发分支**定时**提交 mr 到 review 分支，为了保证代码修改的及时性（测试人员能实时部署修改后的代码），测试环境将部署 debug 分支或开发分支；
7. 测试环境测试完成后，为了保证代码的时效性，release 分支将从 debug 分支或开发分支拉取，review 分支仅做代码 review。

#### 流程图

[查看链接](http://naotu.baidu.com/file/c2cbaa50d227070c46ff05b10502c4ff?token=f69b650fd7327f53)

#### 如何提高 review 的响应效率？

使用**结对 review**，2-3人一组，可以从以下两个点入手：

- 从需求/功能点角度出发，熟悉某个需求的开发者之间 review，甚至可以看业务逻辑；
- 从项目角度，同一项目的代码规范、文件命名都较为一致。

2-3人一组也能明确 review 责任人，及时响应。

#### 如何提高 review 接受度？

养成晚上提 mr，早上 10：00 前 review 代码的习惯，前期可以人工提醒，后续可接入钉钉实现自动化，当然有习惯了是否提醒问题也不大了。

