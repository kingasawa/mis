const sideInfo = {
  back: 0,
  front: 1,
  both: 2,
  unknown: 3,
};
const sideMap = Object.keys(sideInfo);

module.exports.sku = {
  sideInfo,
  getSkuConstraints: {
    size: {
      presence: true,
    },
    color: {
      presence: true,
    },
    mockup: {
      presence: true,
      numericality: {
        message: 'must be a number'
      },

    },
    // owner: {
    //   presence: true,
    //   numericality: true,
    // },
    side: {
      presence: true,
      inclusion: {
        within: sideMap,
        message: `Support: ${sideMap.join(', ')} only`
      }
    },
  },
  skuGeneratorConstraints: {
    designId: {
      presence: true,
      numericality: true,
    },
    productId: {
      presence: true,
      numericality: true,
    },
    sideId: {
      presence: true,
      numericality: true,
    },
  },
  putImageConstraints: {
    imageId: {
      presence: true,
      length: {
        minimum: 30,
        maximum: 35
      }
      // numericality: true,
    }
  },
};
