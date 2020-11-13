class DomElements {
    constructor() {
        this.appEl = document.querySelector(".todo-app");
        this.apiService = new ApiService();

        // start App
        this.loadAll();
        this.addEventToDeleteOperations();
        this.addEventToNewTaskForm();
        this.addEventToRemoveCompletedTasks();
        this.addEventToShowHideLoadedOperations();
        this.addEventToShowNewOperationForm();
        this.addEventToSubmitOperationForm();
        this.addEventToTimer();
        this.addRefreshPageOption();
        this.addRemoveOperationTime();
        this.addShowAddOperationTime();
        this.addFinishTaskEvent();
    }

    addEventToDeleteOperations() {

        /** Add functionality to delete operation button
        (button is only visible when operation expires) **/

        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("delete-operation")) {
                const targetButton = e.target;
                const operationToDelete = targetButton.parentElement;

                operationToDelete.parentElement.removeChild(operationToDelete);

                const operationId = operationToDelete.dataset.id;

                this.apiService.deleteOperation(
                    operationId,
                    (deletedOperation) => {
                        console.log("Successfully deleted operation number " + operationId)
                    },
                    (error) => {
                        console.log(error)
                    });
            }
        })
    }

    addEventToLoadOperations(taskOperationsElement) {
        /** Load operations for task when clicking task header (h2)
         *  element. **/
        const targetH2Element = taskOperationsElement.firstElementChild;

        const taskId = taskOperationsElement.dataset.id;

        targetH2Element.addEventListener('click', (e) => {
            const clickedElement = e.target;

            if (clickedElement.parentElement.dataset.loaded) {
                /* In this case operations exist but are hidden - show them! */
                    let loadedOps = Array.from(clickedElement.parentElement.children).slice(2,(clickedElement.parentElement.children.length));
                    loadedOps.forEach((kid) => {
                    if (kid.classList.contains("d-none")) {
                        kid.classList.remove("d-none");
                    }
                });
                return;
            }

            this.apiService.getOperationsForTask(
                taskId,
                (operations) => {
                    operations.forEach((operation) => {
                        this.createOperationElement(operation, taskOperationsElement);
                    });

                    /* Set data-loaded attribute so you only load once: */

                    clickedElement.parentElement.dataset.loaded = true;

                    /* Create a button to hide loaded operations and nest it in
                     a nice container for aesthetics */

                    if (clickedElement.parentElement.children.length > 2) {

                        /* Only execute this block if task actually has
                         some operations! */

                        const buttonContainer = document.createElement("section");
                        buttonContainer.style.cssText =
                            "background-color: #007bff;" +
                            "text-align: center;" +
                            "width: 100%; height: 40px;" +
                            "align-items: center;" +
                            "justify-content: center;" +
                            "position: relative;" +
                            "border: 1px solid #1520A6;" +
                            "border-radius: 3px;";

                        const hideButton = document.createElement("button");
                        hideButton.classList.add(
                            "btn",
                            "btn-secondary",
                            "hide-operations",
                        );
                        hideButton.innerText = "Hide Operations";
                        hideButton.style.cssText =
                            "position: absolute;" +
                            "left: 40%;";

                        clickedElement.parentElement.appendChild(buttonContainer);
                        buttonContainer.appendChild(hideButton);

                        /* Adding event to handle hiding operations &
                         button: */
                        hideButton.addEventListener("click", (e) => {
                            let targetParentEl = e.target.parentElement.parentElement;
                            let loadedOps = Array.from(targetParentEl.children).slice(2, (targetParentEl.children.length));
                            loadedOps.forEach((kid) => {
                                if (!kid.classList.contains("d-none")) {
                                    kid.classList.add("d-none");
                                }
                            });
                        });
                    }
                },
                (error) => console.log(error)
            );
        });
    }

    addEventToNewTaskForm() {
        /** Handles creating new task from form at the top of the document. **/
        let formEl = document.querySelector("form.new-task");
        formEl.addEventListener("submit", (e) => {
            e.preventDefault();
            let titleEl = e.currentTarget.querySelector("input[name=title]");
            let descriptionEl = e.currentTarget.querySelector("input[name=description]");

            let task = new Task(titleEl.value, descriptionEl.value, "open");

            this.apiService.saveTask(
                task,
                (savedTask) => {
                    this.createTaskElement(savedTask);
                    titleEl.value = '';
                    descriptionEl.value = '';
                },
                (error) => {
                    console.log(error);
                }
            );
        });
    }

    addEventToRemoveCompletedTasks() {
        /** Handles removal of all tasks with "closed" status on button
         *  click. **/
        const targetsParent = document.querySelector("form.new-task");
        const removeCompletedButton = targetsParent.appendChild(document.createElement("input"));

        removeCompletedButton.setAttribute("type", "submit");
        removeCompletedButton.setAttribute("value", "Remove Completed");
        removeCompletedButton.classList.add("btn", "btn-warning", "float-right");

        removeCompletedButton.addEventListener("click", (e) => {
            e.preventDefault();
            const allTasks = Array.from(document.querySelectorAll('.task'));
            let closedTasks = [];
            allTasks.forEach((task) => {
                if (task.dataset.status === "closed") {
                    closedTasks.push(task);
                }
            });
            const taskParent = document.querySelector('div.todo-app');
            closedTasks.forEach((closedTask) => {
                const taskId = closedTask.dataset.id;

                taskParent.removeChild(closedTask);
                this.apiService.deleteTask(
                    taskId,
                    (closedTask) => {
                        console.log(`Say bye bye to task number: ${taskId}.`)
                    },
                    (err) => {
                        console.log(err);
                    }
                );
            });
        });
    }

    addEventToShowHideLoadedOperations() {
        /** Handles checkbox element to hide/show all loaded operations. **/


        /* Create checkbox with label and insert to DOM. */
        const targetsParent = document.querySelector("form.new-task");
        const targetCheckbox = document.createElement("input");
        targetCheckbox.setAttribute("name", "loadedOpsVisible")
        targetCheckbox.setAttribute("type", "checkbox");
        targetCheckbox.setAttribute("checked", "true");
        targetCheckbox.classList.add("float-right");

        const targetsLabel = document.createElement("label");
        targetsLabel.setAttribute("for", "loadedOpsVisible");
        targetsLabel.innerText = "Show Loaded Operations?"
        targetsLabel.classList.add("float-right");

        targetsParent.insertBefore(targetsLabel, targetsParent.children[0]);
        targetsParent.insertBefore(targetCheckbox, targetsLabel);


        /* Adding event to add/remove visibility of all loaded operations */
        targetCheckbox.addEventListener("click", (e) => {
            if (e.target.checked) {
                const loadedTaskSections = Array.from(document.querySelectorAll("section.task"));
                loadedTaskSections.forEach((task) => {
                    if (task.children.length > 2) {
                        const childrenElements = Array.from(task.children).slice(2,(task.children.length+1));
                        childrenElements.forEach((child) => {
                            /* WE NOW SELECTED ONLY THE LOADED OPERATIONS,
                               LET'S CHECK IF THEY ARE VISIBLE. */
                            if (child.classList.contains("d-none")) {
                                child.classList.remove("d-none");
                            }
                        });
                    }
                });
            } else if (e.target.checked === false) {
                const loadedTaskSections = Array.from(document.querySelectorAll("section.task"));
                loadedTaskSections.forEach((task) => {
                    if (task.children.length > 2) {
                        const childrenElements = Array.from(task.children).slice(2, (task.children.length + 1));
                        childrenElements.forEach((child) => {
                            /* REMOVE VISIBILITY FOR LOADED OPERATIONS */
                            if (!child.classList.contains("d-none")) {
                                child.classList.add("d-none");
                            }
                        });
                    }
                });
            }
        });
    }

    addEventToSubmitOperationForm() {
        /** Handles creating new operations. **/
        document.querySelector("div.todo-app").addEventListener("click", (e) => {
            if (
                e.target.parentElement.classList.contains("task-operation-form") &&
                e.target.classList.contains("btn")
            ) {
                e.preventDefault();
                let currentEl = e.target;
                let description = currentEl.previousElementSibling.value;

                let taskId = currentEl.parentElement.parentElement.parentElement.dataset.id;
                let operation = new Operation(description);

                console.log(operation, taskId);

                this.apiService.addOperationForTask(
                    taskId,
                    operation,
                    (savedOperation) => {
                        this.createOperationElement(
                            operation,
                            currentEl.parentElement.parentElement.parentElement
                        );
                        this.addOperationFormVisibility(
                            currentEl.parentElement.parentElement
                        );
                    },
                    (err) => console.log(err)
                );
            }
        });
    }

    addEventToShowNewOperationForm() {
        /** On add-operation-button click --> show user the form to create
            new operation. **/
        document.querySelector("div.todo-app").addEventListener("click", (e) => {
            if (e.target.classList.contains("add-operation")) {
                e.preventDefault();
                let currentEl = e.target;
                let operationFormElParent = currentEl.parentElement.parentElement;
                this.addOperationFormVisibility(operationFormElParent);
            }
        })
    }

    addEventToTimer() {
        /** Handles click on Start Timer button (starts countdown) **/
        document.querySelector("div.todo-app").addEventListener("click", (e) => {
            if (e.target.classList.contains("timer")) {
                e.preventDefault();
                const startTimerButton = e.target;
                let operationEl = startTimerButton.parentElement;
                let timerContainer = operationEl.lastElementChild;
                this.startTimer(timerContainer, operationEl.dataset.time);
            }
        })
    }

    addFinishTaskEvent() {
        /** Changes status of the task to closed. **/
        document.querySelector("div.todo-app").addEventListener("click", (e) => {
            if (e.target.classList.contains("close-task")) {
                e.preventDefault();
                let element = e.target;

                const taskElem = element.parentElement.parentElement.parentElement;
                const taskId = taskElem.dataset.id;
                const taskTitle = taskElem.dataset.title;
                const taskDescription = taskElem.dataset.description;

                const task = new Task(taskTitle, taskDescription);
                task.id = taskId;
                task.status = "closed";

                this.apiService.updateTask(
                    task,
                    (updatedTask) => {
                        element.nextElementSibling.classList.add("d-none");
                        element.parentElement.parentElement.parentElement
                            .querySelectorAll(".btn", "input")
                            .forEach((el) => el.classList.add("d-none"));
                    },
                    (err) => console.log(err)
                );
            }
        });
    }

    addOperationFormVisibility(taskOperationsElement) {
        /** Creates a form to add a new operation **/
        if (taskOperationsElement.dataset.operationForm) {
            taskOperationsElement.removeChild(taskOperationsElement.lastElementChild);
            taskOperationsElement.removeAttribute('data-operation-form');
            return;
        }

        taskOperationsElement.dataset.operationForm = true;

        let operationEl = document.createElement('li');
        operationEl.classList.add(
            'list-group-item',
            'task-operation',
            'task-operation-form',
        );
        taskOperationsElement.appendChild(operationEl);

        let inputDescription = document.createElement('input');
        inputDescription.setAttribute('type', 'text');
        inputDescription.setAttribute('name', 'description');
        inputDescription.setAttribute('placeholder', 'Operation description');
        inputDescription.classList.add('form-control');
        operationEl.appendChild(inputDescription);

        let inputSubmit = document.createElement('input');
        inputSubmit.setAttribute('type', 'submit');
        inputSubmit.setAttribute('value', 'Add');
        inputSubmit.classList.add('btn', 'btn-primary');
        operationEl.appendChild(inputSubmit);
    }

    addRefreshPageOption() {
        /** "In-house" refresh button, to reload the page if needed. Useful
            to register newly created tasks / operations. **/
        const parent = document.querySelector("section");
        const refreshButton = document.createElement("button");
        refreshButton.classList.add(
            "btn",
            "btn-outline-secondary",
            "btn-sm",
            "refresh-btn",
            "float-right"
        );
        refreshButton.innerText = "Refresh";
        refreshButton.style.width = '10%';
        refreshButton.style.marginRight = '22rem';

        parent.appendChild(refreshButton);

        const refreshIcon = document.createElement("img");
        refreshIcon.src = 'https://findicons.com/files/icons/990/vistaico_toolbar/256/refresh.png';
        refreshIcon.style.width = '10%';
        refreshIcon.style.height = '10%';
        refreshButton.appendChild(refreshIcon);

        refreshButton.addEventListener("click", (e) => {
            window.location.reload();
        });
    }

    addRemoveOperationTime() {
        /** Button to reset timeSpent element of given operation. On click
            updates operation status with API. **/
        document.querySelector("div.todo-app").addEventListener("click", (e) => {
            if (e.target.classList.contains("remove-time")) {

                let removeTimeButton = e.target;

                const operationId = removeTimeButton.parentElement.dataset.id;

                const description = removeTimeButton.parentElement.dataset.text;

                const operation = new Operation(description, 0);
                operation.id = operationId;

                this.apiService.updateOperation(
                    operation,
                    (operationsUpdated) => {
                        removeTimeButton.parentElement.dataset.time = operationsUpdated.timeSpent;
                        this.updateOperationTimer(
                            operationsUpdated.timeSpent,
                            removeTimeButton.parentElement
                        );
                    },
                    (err) => console.log(err)
                );
            }
        });

    }

    addShowAddOperationTime() {
        /** Creates a button to add more timeSpent to operation element and
            updates it through API. **/

        document.querySelector("div.todo-app").addEventListener('click', (e) => {
            if (
                e.target.classList.contains("add-time") &&
                !e.target.classList.contains("btn-success")
            ) {
                e.preventDefault();
                let element = e.target;
                element.previousElementSibling.classList.remove("d-none");
                element.innerText = "Save";
                element.classList.add("btn-success");
                if (e.target.parentElement.lastElementChild.classList.contains("badge-secondary")) {
                    const countDownContainer = e.target.parentElement.lastElementChild;
                    countDownContainer.classList.remove("badge-secondary");
                    countDownContainer.classList.add("badge-warning");
                }
            } else if (
                e.target.classList.contains("add-time") &&
                e.target.classList.contains("btn-success")
            ) {
                e.preventDefault();
                let element = e.target

                const taskId = element.parentElement.parentElement.parentElement.dataset.id;
                const operationId = element.parentElement.dataset.id;
                const timeToAdd = parseInt(element.previousElementSibling.value);

                const description = element.parentElement.dataset.text;
                const currentTime = parseInt(element.parentElement.dataset.time);

                const operation = new Operation(description, currentTime + timeToAdd);
                operation.id = operationId;

                this.apiService.updateOperation(
                    operation,
                    (operationsUpdated) => {
                        element.parentElement.dataset.time = operationsUpdated.timeSpent;
                        this.updateOperationTimer(
                            operationsUpdated.timeSpent,
                            element.parentElement
                        );
                    },
                    (err) => console.log(err)
                );

                element.previousElementSibling.classList.add("d-none");
                element.previousElementSibling.value = "";
                element.innerText = "Add time";
                element.classList.remove("btn-success");
            }
        });
    }

    createOperationElement(operation, taskOperationsElement) {
        /** Self-explanatory :) **/
        let operationEl = document.createElement('div');
        operationEl.classList.add('list-group-item', 'task-operation');
        operationEl.dataset.id = operation.id;
        operationEl.dataset.text = operation.description;
        operationEl.dataset.time = operation.timeSpent;
        operationEl.innerText = operation.description;
        taskOperationsElement.appendChild(operationEl);

        const taskStatus = operationEl.parentElement.dataset.status;

        if (taskStatus === "open") {
            let addTimeManualInput = document.createElement("input");
            addTimeManualInput.classList.add("float-right", "add-time-input", "d-none");
            addTimeManualInput.setAttribute("name", "time");
            addTimeManualInput.setAttribute("placeholder", "Time spent in" +
                " seconds");
            operationEl.appendChild(addTimeManualInput);

            let manualTimeButton = document.createElement("a");
            manualTimeButton.classList.add(
                "btn",
                "btn-primary",
                "float-right",
                "add-time"
            );

            manualTimeButton.innerText = "Add time";
            operationEl.appendChild(manualTimeButton);

            let removeTimeButton = document.createElement("a");
            removeTimeButton.classList.add(
                "btn",
                "btn-secondary",
                "float-right",
                "remove-time"
            );

            removeTimeButton.innerText = "Remove time";
            operationEl.appendChild(removeTimeButton);

            let deleteOperationButton = document.createElement("a");
            deleteOperationButton.classList.add(
                "btn",
                "btn-danger",
                "float-right",
                "delete-operation",
            );
            deleteOperationButton.innerText = "Remove Operation";
            operationEl.appendChild(deleteOperationButton);


            let startTimerButton = document.createElement('a');
            startTimerButton.classList.add(
                'btn',
                'btn-primary',
                'float-right',
                'timer'
            );
            startTimerButton.innerText = 'Start timer';
            operationEl.appendChild(startTimerButton);

            let stopWatchIcon = document.createElement("span");
            stopWatchIcon.classList.add(
                "far",
                "fa-clock"
            );
            stopWatchIcon.style.color = '#007bff';
            stopWatchIcon.style.margin = '0px 10px 5px 10px';

            operationEl.appendChild(stopWatchIcon);

            let timeSpentEl = document.createElement("span");
            timeSpentEl.classList.add("badge", "badge-warning", "badge-pill");
            timeSpentEl.innerText = this.timeSpentToString(operation.timeSpent);
            operationEl.appendChild(timeSpentEl);
            if (operation.timeSpent <= 0) {
                timeSpentEl.classList.add("d-none");
            }

            /* IF OPERATION HAS NO TIME TO REMOVE - SHOW REMOVE OPERATION,
                                                - DO NOT SHOW STOPWATCH
                         -->       ELSE       <--
                                                - SHOW REMOVE TIME
                                                - SHOW STOPWATCH             */
            if (operation.timeSpent <= 0) {
                if (!removeTimeButton.classList.contains("d-none")) {
                    removeTimeButton.classList.add("d-none");
                }
                if (deleteOperationButton.classList.contains("d-none")) {
                    deleteOperationButton.classList.remove("d-none");
                }
                if (!stopWatchIcon.classList.contains("d-none")) {
                    stopWatchIcon.classList.add("d-none");
                }
            } else if (operation.timeSpent > 0) {
                /* IF THERE IS TIME TO REMOVE -> SHOW REMOVE TIME & STOPWATCH*/
                if (removeTimeButton.classList.contains("d-none")) {
                    removeTimeButton.classList.remove("d-none");
                }
                if (stopWatchIcon.classList.contains("d-none")) {
                    stopWatchIcon.classList.remove("d-none");
                }
                if (!deleteOperationButton.classList.contains("d-none")) {
                    deleteOperationButton.classList.add("d-none");
                }
            }
        }
    }

    createTaskElement(task) {
        /* Self-explanatory :) */
        let taskSectionEl = document.createElement("section");
        taskSectionEl.classList.add("task");

        taskSectionEl.dataset.id = task.id;
        taskSectionEl.dataset.title = task.title;
        taskSectionEl.dataset.description = task.description;
        taskSectionEl.dataset.status = task.status;

        let taskHeaderEl = document.createElement("h2");
        taskHeaderEl.innerText = task.title;
        taskSectionEl.appendChild(taskHeaderEl);

        let listEl = document.createElement("ul");
        listEl.classList.add("list-group", "todo");
        taskSectionEl.appendChild(listEl);

        let listFirstEl = document.createElement("li");
        listFirstEl.classList.add("list-group-item", "active", "task-description");
        listFirstEl.innerText = task.description;
        listEl.appendChild(listFirstEl);

        if (task.status === "open") {
            let finishButton = document.createElement("a");
            finishButton.classList.add(
                "btn",
                "btn-danger",
                "float-right",
                "close-task"
            );
            finishButton.innerText = "Finish";
            listFirstEl.appendChild(finishButton);

            let addOperationButton = document.createElement("a");
            addOperationButton.classList.add(
                "btn",
                "btn-success",
                "float-right",
                "add-operation"
            );
            addOperationButton.innerText = "Add operation";
            listFirstEl.appendChild(addOperationButton);
        }

        this.appEl.appendChild(taskSectionEl);
        this.addEventToLoadOperations(taskSectionEl);
    }

    loadAll() {
        /* load all tasks from database (through API) */
        this.apiService.getTasks(
            (tasks) => {
                tasks.map((task) => {
                    this.createTaskElement(task);
                });
            },
            (error) => {
                console.log(error);
            }
        );
    }

    updateOperationTimer(time, operationElement) {
        /** Updates time in span and handles visibility under different
            conditions. **/
        if (time > 0) {
            operationElement.querySelector(
                "span.badge"
            ).innerText = this.timeSpentToString(time);
            operationElement.querySelector("span.badge").classList.remove("d-none");
            operationElement.querySelector(".remove-time").classList.remove("d-none");
            if (!operationElement.querySelector(".delete-operation").classList.contains("d-none")) {
                operationElement.querySelector(".delete-operation").classList.add("d-none");
            }
            if (operationElement.querySelector("span.far").classList.contains("d-none")) {
                operationElement.querySelector("span.far").classList.remove("d-none");
            }
        } else if (time === 0) {
            const badge = operationElement.querySelector("span.badge");
            badge.classList.remove("d-none");
            badge.innerText = "expired";
            const icon = operationElement.querySelector("span.far");
            icon.classList.add("d-none");
            operationElement.querySelector(".remove-time").classList.add("d-none");
            operationElement.querySelector(".delete-operation").classList.remove("d-none");
        } else {
            operationElement.querySelector("span.badge").innerText = 0;
            operationElement.querySelector("span.badge").classList.add("d-none");
            operationElement.querySelector(".remove-time").classList.add("d-none");
            operationElement.querySelector("span.far").classList.add("d-none");
            operationElement.querySelector(".delete-operation").classList.remove("d-none");
        }
    }

    timeSpentToString(timeSpent) {
        /** Takes in time in seconds, returns formatted in hrs, mins, s. **/
        let hours = Math.floor(timeSpent / 3600);
        let minutes = Math.floor((timeSpent % 3600) / 60);
        let seconds = Math.floor((timeSpent % 3600) % 60);

        return `${hours}h ${minutes}m ${seconds}s`;
    }

    startTimer(target, timeSpent) {
        /** Starts countdown timer and updates timeSpent every second until
           it reaches 0. Updates API every second, not the best approach,
           but works. **/
        let funcTarget = target;
        let countDownTime = timeSpent;

        const interval = setInterval(() => {
            countDownTime--;
            funcTarget.innerText = (this.timeSpentToString(countDownTime));
            const description = funcTarget.parentElement.dataset.text;

            const operation = new Operation(description, countDownTime);
            operation.id = funcTarget.parentElement.dataset.id;

            this.apiService.updateOperation(
                operation,
                (operationUpdated) => {
                    funcTarget.parentElement.dataset.time = operationUpdated.timeSpent
                    this.updateOperationTimer(
                        operationUpdated.timeSpent,
                        funcTarget.parentElement
                    );
                },
                (error) => console.log(error)
            );
            if (countDownTime <= 0) {
                clearInterval(interval);
                funcTarget.innerText = "expired";
                funcTarget.classList.remove("badge-warning");
                funcTarget.classList.add("badge-secondary");
            }

        }, 1000);
    }
}
