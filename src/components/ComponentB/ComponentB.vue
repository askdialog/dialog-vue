<script lang="ts">
export default {
  name: 'ComponentB',
  props: {
    message: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      cpt: 0,
    };
  },
  methods: {
    handleClick() {
      console.log('clicked');
      this.cpt++;
    },
  },
};
</script>

<template>
  <div class="component-b">
    <div>
      Hello this is component B : {{ message }} - Click counter : {{ cpt }}
    </div>
    <button @click="handleClick">Increment counter</button>
  </div>
</template>
