## 基于 Merge Request 的代码 review 工作流（by qinyf）

1、接到新需求后需求负责人从 master 上创建需求分支（格式如，**test_项目名称_创建者名称_日期**）；

2、开发人员从需求分支上拉取任务分支进行需求开发（格式如，**20190816_任务名称_创建者名称_dev**）；

3、当在开发人员任务开发完成之后创建 merge request，目标分支指向需求分支，并指向对应相关 review 人员；

![review-1](https://github.com/qinyuanf/front-end-Weekly/blob/master/screenshot/review/reivew-1.png "review-1")
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
