class APIFeatures {
  public query: any;
  private queryString: Record<string, any>;
  private type: string;

  constructor(query: any, queryString: Record<string, any>) {
    this.query = query;
    this.queryString = queryString;
    this.type = queryString.type;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ["page", "sort", "limit", "fields", "searchText"];

    excludeFields.forEach((el) => delete queryObj[el]);

    const deepConvertNumber = (obj: Record<string, any>) => {
      for (const key in obj) {
        if (
          typeof obj[key] === "object" &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          deepConvertNumber(obj[key]);
        } else if (typeof obj[key] === "string" && !isNaN(Number(obj[key]))) {
          obj[key] = Number(obj[key]);
        }
      }
    };

    deepConvertNumber(queryObj);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let filterObj = JSON.parse(queryStr);

    if (this.type === "all") {
      filterObj = {
        ...filterObj,
        type: ["other", "hotpot", "japanese", "bbq", "steakhouse"],
      };
    }

    if (this.queryString.searchText) {
      filterObj = {
        ...filterObj,
        $or: [
          { name: { $regex: this.queryString.searchText, $options: "i" } },
          { type: { $regex: this.queryString.searchText, $options: "i" } },
          { address: { $regex: this.queryString.searchText, $options: "i" } },
        ],
      };
    }

    this.query = this.query.find(filterObj);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitField() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  pagination() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeatures;
