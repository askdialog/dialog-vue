import DialogBlock from './components/DialogBlock.vue';

export { DialogBlock };

export default {
  install(app) {
    app.component('DialogBlock', DialogBlock);
  },
};
